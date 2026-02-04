import os
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import requests

import unicodedata
import re
import difflib

# ==========================
# CONFIGURAÇÕES GERAIS
# ==========================

PRECO_DIR = "/home/diego/historias/precos"
os.makedirs(PRECO_DIR, exist_ok=True)

CAMINHO_ARQUIVO_DEFAULT = "/home/diego/historias/precos"

MARKET_CSV_FILES = {
    "Atacadão Jundiaí": "atacadao_jundiai.csv",
    "Assaí Atacadista Jundiaí": "assai_jundiai.csv",
    "Tenda Atacado Jundiaí": "tenda_jundiai.csv",
    "Roldão Atacadista Jundiaí": "roldao_jundiai.csv",
}

MARKETS_INFO = {
    "Atacadão Jundiaí": {
        "address": "Av. Pres. Castelo Branco, 4000 - Vila Rami, Jundiaí - SP"
    },
    "Assaí Atacadista Jundiaí": {
        "address": "Av. Pref. Luiz Latorre, 5000 - Vila das Hortênsias, Jundiaí - SP"
    },
    "Tenda Atacado Jundiaí": {
        "address": "Av. Antônio Frederico Ozanan, 6000 - Vila Rio Branco, Jundiaí - SP"
    },
    "Roldão Atacadista Jundiaí": {
        "address": "Rod. Anhanguera, km 58 - Anhangabaú, Jundiaí - SP"
    },
}

CUSTO_POR_KM = 1.5  # R$ / km

# ==========================
# GOOGLE MAPS / PLACES API
# ==========================

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
    print("⚠️  Atenção: variável de ambiente GOOGLE_MAPS_API_KEY não definida.")

# resultados globais das distribuidoras
DISTRIBUIDORAS_ENCONTRADAS: list[dict] = []
DISTRIBUIDORAS_MIN_RATING = 3.5


# ==========================
# NORMALIZAÇÃO DE NOMES
# ==========================

def normalizar_nome(texto: str) -> str:
    """Deixa o nome em minúsculo, sem acento e com espaços normalizados."""
    if texto is None:
        return ""
    t = str(texto).strip().lower()
    t = "".join(
        c for c in unicodedata.normalize("NFD", t)
        if unicodedata.category(c) != "Mn"
    )
    t = re.sub(r"\s+", " ", t)
    return t


# ==========================
# CARREGAR TABELA DE PREÇOS (CSV)
# ==========================

def carregar_tabela_precos(nome_atacado: str) -> pd.DataFrame:
    """
    Carrega o CSV de preços do mercado informado.
    Espera um arquivo com ao menos colunas: produto, preco.
    Tenta se adaptar a arquivos com cabeçalho "produto,preco" ou "produto;preco".
    """
    if nome_atacado not in MARKET_CSV_FILES:
        raise ValueError(f"Não há CSV configurado para o mercado: {nome_atacado}")

    csv_name = MARKET_CSV_FILES[nome_atacado]
    caminho_csv = os.path.join(PRECO_DIR, csv_name)

    if not os.path.exists(caminho_csv):
        raise FileNotFoundError(
            f"Arquivo de preços não encontrado para {nome_atacado}: {caminho_csv}"
        )

    # deixa o pandas "farejar" o separador
    df = pd.read_csv(caminho_csv, sep=None, engine="python")

    # normaliza nomes de colunas
    df.columns = [c.strip().lower() for c in df.columns]

    # remove colunas "unnamed"
    cols_validas = [c for c in df.columns if not c.startswith("unnamed")]
    df = df[cols_validas]

    possiveis_produto = ["produto", "descricao", "descrição", "item", "nome"]
    possiveis_preco = ["preco", "preço", "valor"]

    # caso especial: cabeçalho combinado "produto,preco" ou "produto;preco"
    combined_col = None
    for col in df.columns:
        if "produto" in col and ("preco" in col or "preço" in col):
            combined_col = col
            break

    tem_produto_separado = any(c in df.columns for c in possiveis_produto)
    tem_preco_separado = any(c in df.columns for c in possiveis_preco)

    if combined_col is not None and not (tem_produto_separado and tem_preco_separado):
        serie = df[combined_col].astype(str)
        amostra = serie.iloc[0] if not serie.empty else ""
        if ";" in amostra:
            inner_sep = ";"
        elif "," in amostra:
            inner_sep = ","
        else:
            inner_sep = ","
        split_cols = serie.str.split(inner_sep, n=1, expand=True)
        split_cols.columns = ["produto", "preco"]
        df = split_cols
        df.columns = [c.strip().lower() for c in df.columns]

    # recalcula após ajustes
    col_produto = None
    col_preco = None
    for col in df.columns:
        if col in possiveis_produto and col_produto is None:
            col_produto = col
        if col in possiveis_preco and col_preco is None:
            col_preco = col

    if col_produto is None or col_preco is None:
        raise ValueError(
            f"O CSV de {nome_atacado} deve ter colunas de produto e preço. "
            f"Colunas encontradas: {df.columns.tolist()}"
        )

    df = df[[col_produto, col_preco]].rename(
        columns={col_produto: "produto", col_preco: "preco"}
    )

    df["preco"] = (
        df["preco"]
        .astype(str)
        .str.replace("R$", "", regex=False)
        .str.replace(".", "", regex=False)   # milhar
        .str.replace(",", ".", regex=False)  # vírgula → ponto
        .str.strip()
        .replace("", "0")
        .astype(float)
    )

    df["produto_norm"] = df["produto"].apply(normalizar_nome)
    return df


def buscar_preco_produto(df_precos: pd.DataFrame, nome_produto: str) -> float:
    """Busca preço por match exato ou aproximado; se não achar, retorna 0.0."""
    nome_norm = normalizar_nome(nome_produto)

    linha = df_precos[df_precos["produto_norm"] == nome_norm]
    if not linha.empty:
        return float(linha["preco"].iloc[0])

    todos_nomes = df_precos["produto_norm"].tolist()
    candidatos = difflib.get_close_matches(nome_norm, todos_nomes, n=1, cutoff=0.75)
    if candidatos:
        candidato = candidatos[0]
        linha = df_precos[df_precos["produto_norm"] == candidato]
        if not linha.empty:
            return float(linha["preco"].iloc[0])

    return 0.0


# ==========================
# LISTA DE COMPRAS (EXCEL)
# ==========================

def carregar_lista_compras(caminho: str = CAMINHO_ARQUIVO_DEFAULT) -> pd.DataFrame:
    """
    Carrega o XLSX mesmo sem cabeçalho.
    Assume: 1ª coluna = produto, 2ª = quantidade.
    """
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    df = pd.read_excel(caminho, header=None)
    df = df.dropna(how="all")
    df = df.dropna(axis=1, how="all")

    if df.shape[1] < 2:
        raise ValueError(
            "A planilha precisa ter pelo menos 2 colunas com produto e quantidade."
        )

    col_produto = df.columns[0]
    col_quantidade = df.columns[1]

    df = df.rename(columns={col_produto: "produto", col_quantidade: "quantidade"})
    df["quantidade"] = pd.to_numeric(df["quantidade"], errors="coerce").fillna(0)

    return df[["produto", "quantidade"]]


# ==========================
# BUSCA DE PREÇOS E TOTAIS
# ==========================

def buscar_precos_na_web(nome_atacado: str, lista_produtos) -> dict:
    df_precos = carregar_tabela_precos(nome_atacado)
    precos = {}
    for produto in lista_produtos:
        precos[produto] = buscar_preco_produto(df_precos, produto)
    return precos


def calcular_totais(df_lista: pd.DataFrame):
    produtos = df_lista["produto"].tolist()
    dict_totais = {}
    dict_detalhes = {}

    for mercado in MARKETS_INFO.keys():
        precos = buscar_precos_na_web(mercado, produtos)

        total_mercado = 0.0
        detalhes = []
        for _, row in df_lista.iterrows():
            produto = row["produto"]
            quantidade = float(row["quantidade"])
            preco_unit = precos.get(produto, 0.0)
            subtotal = quantidade * preco_unit
            total_mercado += subtotal

            detalhes.append({
                "produto": produto,
                "quantidade": quantidade,
                "preco_unit": preco_unit,
                "subtotal": subtotal,
            })

        dict_totais[mercado] = round(total_mercado, 2)
        dict_detalhes[mercado] = detalhes

    return dict_totais, dict_detalhes


# ==========================
# DISTÂNCIA (GOOGLE DISTANCE MATRIX)
# ==========================

def obter_distancias_google(cidade_origem: str, custo_por_km: float = CUSTO_POR_KM):
    api_key = GOOGLE_MAPS_API_KEY or os.getenv("GOOGLE_MAPS_API_KEY")

    resultados = {
        nome: {"distance_km": None, "duration_min": None, "custo_viagem": 0.0}
        for nome in MARKETS_INFO.keys()
    }

    if not api_key:
        return resultados

    origins = [cidade_origem]
    destinations = [info["address"] for info in MARKETS_INFO.values()]

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": "|".join(origins),
        "destinations": "|".join(destinations),
        "mode": "driving",
        "language": "pt-BR",
        "key": api_key,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        rows = data.get("rows", [])
        if not rows:
            return resultados

        elements = rows[0].get("elements", [])
        nomes = list(MARKETS_INFO.keys())

        for idx, elem in enumerate(elements):
            if idx >= len(nomes):
                break
            nome = nomes[idx]
            if elem.get("status") != "OK":
                continue

            dist_m = elem["distance"]["value"]
            dur_s = elem["duration"]["value"]

            dist_km = dist_m / 1000.0
            dur_min = dur_s / 60.0
            custo = 2 * dist_km * custo_por_km  # ida e volta

            resultados[nome] = {
                "distance_km": dist_km,
                "duration_min": dur_min,
                "custo_viagem": custo,
            }

    except Exception:
        return resultados

    return resultados


# ==========================
# ANÁLISE COMPLETA (PRODUTOS + DESLOCAMENTO)
# ==========================

def analisar_mercados(df_lista: pd.DataFrame, cidade_origem: str):
    dict_totais, dict_detalhes = calcular_totais(df_lista)
    dist_infos = obter_distancias_google(cidade_origem)

    resumo = {}
    for mercado, total in dict_totais.items():
        dist_info = dist_infos.get(mercado, {})
        distancia_km = dist_info.get("distance_km")
        dur_min = dist_info.get("duration_min")
        custo_viagem = dist_info.get("custo_viagem", 0.0)

        total_com_desloc = total + custo_viagem

        resumo[mercado] = {
            "total_produtos": total,
            "distancia_km": distancia_km,
            "tempo_min": dur_min,
            "custo_viagem": custo_viagem,
            "total_com_deslocamento": total_com_desloc,
        }

    melhores = sorted(resumo.items(), key=lambda kv: kv[1]["total_com_deslocamento"])

    if melhores:
        melhor_valor = melhores[0][1]["total_com_deslocamento"]
        for mercado, info in resumo.items():
            diff = info["total_com_deslocamento"] - melhor_valor
            perc = (diff / melhor_valor * 100) if melhor_valor > 0 else 0.0
            info["diferenca_reais"] = diff
            info["diferenca_percentual"] = perc

    return dict_totais, dict_detalhes, resumo


# ==========================
# GOOGLE PLACES – TELEFONE & DISTRIBUIDORAS
# ==========================

def buscar_telefone_place(place_id: str) -> str:
    """Chama Place Details para obter telefone comercial."""
    if not place_id or not GOOGLE_MAPS_API_KEY:
        return "Sem telefone"

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "formatted_phone_number,international_phone_number",
        "language": "pt-BR",
        "key": GOOGLE_MAPS_API_KEY,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        result = data.get("result", {})
        tel1 = result.get("formatted_phone_number")
        tel2 = result.get("international_phone_number")
        return tel1 or tel2 or "Sem telefone"
    except Exception:
        return "Erro ao obter telefone"


def buscar_distribuidoras_google(city: str = "Jundiaí, SP",
                                 min_rating: float = DISTRIBUIDORAS_MIN_RATING):
    """
    Busca distribuidoras de alimentos na cidade (TextSearch)
    + enriquece com telefone (Place Details).
    """
    global DISTRIBUIDORAS_ENCONTRADAS

    if not GOOGLE_MAPS_API_KEY:
        messagebox.showerror(
            "Erro de configuração",
            "A variável de ambiente GOOGLE_MAPS_API_KEY não está configurada."
        )
        return

    query = f"distribuidora de alimentos atacado para supermercados e minimercados em {city}"

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "key": GOOGLE_MAPS_API_KEY,
        "language": "pt-BR",
        "region": "br",
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        data = resp.json()

        status = data.get("status", "")
        if status not in ("OK", "ZERO_RESULTS"):
            messagebox.showerror(
                "Erro na API do Google",
                f"Status: {status}\n\n{data.get('error_message','')}"
            )
            DISTRIBUIDORAS_ENCONTRADAS = []
            return

        resultados_raw = data.get("results", [])
        resultados = []

        for place in resultados_raw:
            nome = place.get("name", "Sem nome")
            endereco = place.get("formatted_address", "Sem endereço")
            rating = place.get("rating")
            place_id = place.get("place_id")

            telefone = buscar_telefone_place(place_id)

            aberto_agora = None
            if place.get("opening_hours") and "open_now" in place["opening_hours"]:
                aberto_agora = place["opening_hours"]["open_now"]

            resultados.append({
                "nome": nome,
                "endereco": endereco,
                "telefone": telefone,
                "rating": rating,
                "aberto_agora": aberto_agora,
            })

        # filtro de nota mínima (mantém sem avaliação)
        if min_rating is not None:
            filtrados = []
            for r in resultados:
                if r["rating"] is None or r["rating"] >= min_rating:
                    filtrados.append(r)
            resultados = filtrados

        resultados_ordenados = sorted(
            resultados,
            key=lambda r: (r["rating"] is None, -r["rating"] if r["rating"] else 0)
        )

        DISTRIBUIDORAS_ENCONTRADAS = resultados_ordenados
        mostrar_janela_distribuidoras(resultados_ordenados, city, min_rating)

    except Exception as e:
        messagebox.showerror(
            "Erro inesperado",
            f"Ocorreu um erro ao buscar distribuidoras:\n\n{e}"
        )
        DISTRIBUIDORAS_ENCONTRADAS = []


def mostrar_janela_distribuidoras(resultados: list,
                                  city: str,
                                  min_rating: float | None = None):
    """Janela com Treeview listando distribuidoras + telefone."""
    janela = tk.Toplevel()
    janela.title("Distribuidoras de alimentos")
    janela.geometry("950x500")

    if min_rating is not None:
        titulo = f"Distribuidoras em {city} (nota mínima: {min_rating})"
    else:
        titulo = f"Distribuidoras em {city}"

    label = ttk.Label(
        janela,
        text=titulo,
        font=("Segoe UI", 11, "bold")
    )
    label.pack(pady=10)

    colunas = ("nome", "endereco", "telefone", "rating", "aberto_agora")
    tree = ttk.Treeview(janela, columns=colunas, show="headings")

    tree.heading("nome", text="Nome")
    tree.heading("endereco", text="Endereço")
    tree.heading("telefone", text="Telefone")
    tree.heading("rating", text="Nota")
    tree.heading("aberto_agora", text="Aberto agora")

    tree.column("nome", width=220)
    tree.column("endereco", width=360)
    tree.column("telefone", width=130)
    tree.column("rating", width=80, anchor="center")
    tree.column("aberto_agora", width=100, anchor="center")

    vsb = ttk.Scrollbar(janela, orient="vertical", command=tree.yview)
    hsb = ttk.Scrollbar(janela, orient="horizontal", command=tree.xview)
    tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

    tree.pack(side="top", fill="both", expand=True)
    vsb.pack(side="right", fill="y")
    hsb.pack(side="bottom", fill="x")

    for item in resultados:
        if item["aberto_agora"] is True:
            aberto_txt = "Sim"
        elif item["aberto_agora"] is False:
            aberto_txt = "Não"
        else:
            aberto_txt = "Sem info"

        rating = item["rating"] if item["rating"] is not None else "-"

        tree.insert(
            "",
            "end",
            values=(
                item["nome"],
                item["endereco"],
                item["telefone"],
                rating,
                aberto_txt,
            ),
        )


def exportar_distribuidoras_para_excel():
    """Exporta as distribuidoras encontradas (inclui telefone) para Excel."""
    global DISTRIBUIDORAS_ENCONTRADAS

    if not DISTRIBUIDORAS_ENCONTRADAS:
        messagebox.showwarning(
            "Atenção",
            "Nenhuma distribuidora encontrada ainda.\n"
            "Clique primeiro em 'Distribuidoras em Jundiaí'."
        )
        return

    caminho = filedialog.asksaveasfilename(
        title="Salvar distribuidoras",
        defaultextension=".xlsx",
        filetypes=[("Planilha Excel", "*.xlsx")],
    )
    if not caminho:
        return

    try:
        df = pd.DataFrame(DISTRIBUIDORAS_ENCONTRADAS)
        df.to_excel(caminho, index=False, sheet_name="Distribuidoras")
        messagebox.showinfo("Sucesso", f"Distribuidoras exportadas para:\n{caminho}")
    except Exception as e:
        messagebox.showerror("Erro ao exportar distribuidoras", str(e))


# ==========================
# INTERFACE TKINTER (APP)
# ==========================

class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Comparador de Atacados - Jundiaí")
        self.geometry("1200x700")

        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass

        self.configure(bg="#202124")
        style.configure(".", background="#202124", foreground="#f5f5f5")
        style.configure("TLabel", background="#202124", foreground="#f5f5f5")
        style.configure("TButton", padding=6)
        style.configure(
            "Treeview",
            background="#303134",
            fieldbackground="#303134",
            foreground="#f5f5f5",
        )

        self.caminho_arquivo = CAMINHO_ARQUIVO_DEFAULT
        self.df_lista = None
        self.dict_totais = {}
        self.dict_detalhes = {}
        self.resumo_mercados = {}

        self.create_widgets()

    def create_widgets(self):
        frame_top = ttk.Frame(self)
        frame_top.pack(side=tk.TOP, fill=tk.X, padx=10, pady=10)

        btn_abrir = ttk.Button(
            frame_top, text="Abrir lista de compras", command=self.on_abrir_arquivo
        )
        btn_abrir.pack(side=tk.LEFT, padx=5)

        btn_buscar = ttk.Button(
            frame_top, text="Buscar preços e analisar", command=self.on_buscar_precos
        )
        btn_buscar.pack(side=tk.LEFT, padx=5)

        btn_exportar = ttk.Button(
            frame_top, text="Exportar relatório", command=self.on_exportar_relatorio
        )
        btn_exportar.pack(side=tk.LEFT, padx=5)

        btn_dash = ttk.Button(
            frame_top, text="Dash por produto", command=self.on_abrir_dash_produtos
        )
        btn_dash.pack(side=tk.LEFT, padx=5)

        btn_distribuidoras = ttk.Button(
            frame_top,
            text="Distribuidoras em Jundiaí",
            command=self.on_buscar_distribuidoras,
        )
        btn_distribuidoras.pack(side=tk.LEFT, padx=5)

        btn_exportar_dist = ttk.Button(
            frame_top,
            text="Exportar distribuidoras",
            command=exportar_distribuidoras_para_excel,
        )
        btn_exportar_dist.pack(side=tk.LEFT, padx=5)

        ttk.Label(frame_top, text="Cidade (origem):").pack(side=tk.LEFT, padx=(20, 5))
        self.entry_cidade = ttk.Entry(frame_top, width=30)
        self.entry_cidade.insert(0, "Jundiaí, SP")
        self.entry_cidade.pack(side=tk.LEFT, padx=5)

        self.lbl_status = ttk.Label(frame_top, text="Status: aguardando ação...")
        self.lbl_status.pack(side=tk.LEFT, padx=20)

        frame_table = ttk.Frame(self)
        frame_table.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        colunas = (
            "mercado",
            "total_produtos",
            "distancia_km",
            "tempo_min",
            "custo_viagem",
            "total_com_desloc",
        )
        self.tree = ttk.Treeview(frame_table, columns=colunas, show="headings")

        for col, text, width in [
            ("mercado", "Mercado", 200),
            ("total_produtos", "Total produtos (R$)", 130),
            ("distancia_km", "Distância (km)", 110),
            ("tempo_min", "Tempo (min)", 100),
            ("custo_viagem", "Custo viagem (R$)", 130),
            ("total_com_desloc", "Total + viagem (R$)", 150),
        ]:
            self.tree.heading(col, text=text)
            self.tree.column(col, width=width, anchor=tk.CENTER)

        self.tree.pack(fill=tk.BOTH, expand=True)

        self.lbl_melhor = ttk.Label(frame_table, text="Melhor mercado: -")
        self.lbl_melhor.pack(side=tk.TOP, pady=5)

        frame_chart = ttk.Frame(self)
        frame_chart.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.fig = plt.Figure(figsize=(7, 5), dpi=100)
        self.ax_bar = self.fig.add_subplot(2, 2, (1, 3))
        self.ax_pie = self.fig.add_subplot(2, 2, 2)
        self.ax_line = self.fig.add_subplot(2, 2, 4)

        self.canvas = FigureCanvasTkAgg(self.fig, master=frame_chart)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # ---------- ações ----------

    def on_abrir_arquivo(self):
        caminho = filedialog.askopenfilename(
            title="Selecione a lista de compras",
            initialdir=os.path.dirname(CAMINHO_ARQUIVO_DEFAULT),
            filetypes=[("Planilhas Excel", "*.xlsx *.xls"), ("Todos os arquivos", "*.*")],
        )
        if not caminho:
            return

        self.caminho_arquivo = caminho
        try:
            self.df_lista = carregar_lista_compras(self.caminho_arquivo)
            self.lbl_status.config(text=f"Lista carregada: {self.caminho_arquivo}")
            messagebox.showinfo("Sucesso", "Lista de compras carregada com sucesso!")
        except Exception as e:
            messagebox.showerror("Erro ao carregar lista", str(e))
            self.lbl_status.config(text="Erro ao carregar lista.")

    def on_buscar_precos(self):
        if self.df_lista is None:
            try:
                self.df_lista = carregar_lista_compras(self.caminho_arquivo)
            except Exception as e:
                messagebox.showerror("Erro ao carregar lista", str(e))
                return

        cidade = self.entry_cidade.get().strip() or "Jundiaí, SP"
        self.lbl_status.config(
            text="Buscando preços (CSV) e analisando (IA de deslocamento)..."
        )
        self.update_idletasks()

        try:
            (
                self.dict_totais,
                self.dict_detalhes,
                self.resumo_mercados,
            ) = analisar_mercados(self.df_lista, cidade)

            for item in self.tree.get_children():
                self.tree.delete(item)

            for mercado, info in self.resumo_mercados.items():
                self.tree.insert(
                    "",
                    tk.END,
                    values=(
                        mercado,
                        f"{info['total_produtos']:.2f}",
                        f"{info['distancia_km']:.1f}"
                        if info["distancia_km"] is not None
                        else "-",
                        f"{info['tempo_min']:.1f}"
                        if info["tempo_min"] is not None
                        else "-",
                        f"{info['custo_viagem']:.2f}",
                        f"{info['total_com_deslocamento']:.2f}",
                    ),
                )

            self.atualizar_graficos()

            melhor = min(
                self.resumo_mercados.items(),
                key=lambda kv: kv[1]["total_com_deslocamento"],
            )
            nome, info = melhor

            self.lbl_status.config(
                text=(
                    f"Melhor opção (com deslocamento): "
                    f"{nome} (R$ {info['total_com_deslocamento']:.2f})"
                )
            )
            self.lbl_melhor.config(
                text=f"Melhor mercado considerando distância: {nome}"
            )

        except Exception as e:
            messagebox.showerror("Erro", str(e))
            self.lbl_status.config(text="Erro ao buscar preços.")

    def on_buscar_distribuidoras(self):
        cidade = self.entry_cidade.get().strip() or "Jundiaí, SP"
        buscar_distribuidoras_google(cidade, DISTRIBUIDORAS_MIN_RATING)

    def atualizar_graficos(self):
        self.ax_bar.clear()
        self.ax_pie.clear()
        self.ax_line.clear()

        if not self.resumo_mercados:
            self.canvas.draw()
            return

        mercados = list(self.resumo_mercados.keys())
        totais = [info["total_com_deslocamento"]
                  for info in self.resumo_mercados.values()]
        totais_produtos = [info["total_produtos"]
                           for info in self.resumo_mercados.values()]

        idx_min = min(range(len(totais)), key=lambda i: totais[i])
        cores = ["gray"] * len(mercados)
        cores[idx_min] = "green"

        self.ax_bar.bar(mercados, totais, color=cores)
        self.ax_bar.set_title("Total com deslocamento (R$)")
        self.ax_bar.tick_params(axis="x", rotation=20)

        melhor_valor = totais[idx_min]
        for i, v in enumerate(totais):
            if i == idx_min:
                label = f"{v:.2f}\n(MELHOR)"
            else:
                diff_percent = (
                    (v - melhor_valor) / melhor_valor * 100 if melhor_valor > 0 else 0
                )
                label = f"{v:.2f}\n(+{diff_percent:.1f}%)"
            self.ax_bar.text(i, v, label, ha="center", va="bottom", fontsize=8)

        self.ax_pie.pie(totais_produtos, labels=mercados, autopct="%1.1f%%")
        self.ax_pie.set_title("Distribuição do gasto só em produtos")

        self.ax_line.plot(mercados, totais, marker="o")
        self.ax_line.set_title("Comparação total + deslocamento")
        self.ax_line.tick_params(axis="x", rotation=20)

        self.fig.tight_layout()
        self.canvas.draw()

    # ---------- DASH POR PRODUTO ----------

    def montar_df_produtos(self):
        if not self.dict_detalhes:
            return None

        linhas = []
        for mercado, itens in self.dict_detalhes.items():
            for item in itens:
                linhas.append(
                    {
                        "Produto": item["produto"],
                        "Mercado": mercado,
                        "Quantidade": item["quantidade"],
                        "Preço unitário": item["preco_unit"],
                        "Subtotal": item["subtotal"],
                    }
                )

        df = pd.DataFrame(linhas)
        df = (
            df.groupby(["Produto", "Mercado"], as_index=False)
            .agg(
                {
                    "Quantidade": "sum",
                    "Preço unitário": "mean",
                    "Subtotal": "sum",
                }
            )
        )
        return df

    def on_abrir_dash_produtos(self):
        if not self.dict_detalhes:
            messagebox.showwarning(
                "Atenção",
                "Você precisa primeiro clicar em 'Buscar preços e analisar'.",
            )
            return

        df = self.montar_df_produtos()
        if df is None or df.empty:
            messagebox.showwarning("Atenção", "Não há dados de produtos para exibir.")
            return

        win = tk.Toplevel(self)
        win.title("Dashboard por produto e supermercado")
        win.geometry("900x600")
        win.configure(bg="#202124")

        frame_left = ttk.Frame(win)
        frame_left.pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=10)

        frame_right = ttk.Frame(win)
        frame_right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        ttk.Label(frame_left, text="Produtos").pack(anchor="w")

        listbox = tk.Listbox(
            frame_left,
            height=25,
            bg="#303134",
            fg="#f5f5f5",
            selectbackground="#505355",
        )
        listbox.pack(fill=tk.Y, expand=True)

        produtos_unicos = sorted(df["Produto"].unique())
        for p in produtos_unicos:
            listbox.insert(tk.END, p)

        fig_dash = plt.Figure(figsize=(5, 4), dpi=100)
        ax_dash = fig_dash.add_subplot(111)
        canvas_dash = FigureCanvasTkAgg(fig_dash, master=frame_right)
        canvas_dash.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        def atualizar_grafico(produto):
            ax_dash.clear()
            df_p = df[df["Produto"] == produto]

            mercados = df_p["Mercado"].tolist()
            valores = df_p["Subtotal"].tolist()

            ax_dash.bar(mercados, valores)
            ax_dash.set_title(f"{produto}\nSubtotal por mercado (R$)")
            ax_dash.tick_params(axis="x", rotation=20)
            for i, v in enumerate(valores):
                ax_dash.text(i, v, f"{v:.2f}", ha="center", va="bottom", fontsize=8)

            fig_dash.tight_layout()
            canvas_dash.draw()

        def on_select(event):
            sel = listbox.curselection()
            if not sel:
                return
            produto = listbox.get(sel[0])
            atualizar_grafico(produto)

        listbox.bind("<<ListboxSelect>>", on_select)

        if produtos_unicos:
            listbox.selection_set(0)
            atualizar_grafico(produtos_unicos[0])

    def on_exportar_relatorio(self):
        if not self.resumo_mercados:
            messagebox.showwarning(
                "Atenção", "Faça primeiro a análise antes de exportar."
            )
            return

        caminho = filedialog.asksaveasfilename(
            title="Salvar relatório Excel",
            defaultextension=".xlsx",
            filetypes=[("Planilha Excel", "*.xlsx")],
        )
        if not caminho:
            return

        try:
            linhas_mercados = []
            for mercado, info in self.resumo_mercados.items():
                base = {
                    "Mercado": mercado,
                    "Total produtos (R$)": info["total_produtos"],
                    "Distância (km)": info["distancia_km"],
                    "Tempo (min)": info["tempo_min"],
                    "Custo viagem (R$)": info["custo_viagem"],
                    "Total + viagem (R$)": info["total_com_deslocamento"],
                    "Diferença (R$)": info.get("diferenca_reais"),
                    "Diferença (%)": info.get("diferenca_percentual"),
                }
                linhas_mercados.append(base)

            df_mercados = pd.DataFrame(linhas_mercados)

            linhas_itens = []
            for mercado, itens in self.dict_detalhes.items():
                for item in itens:
                    linha = item.copy()
                    linha["Mercado"] = mercado
                    linhas_itens.append(linha)

            df_itens = pd.DataFrame(linhas_itens)
            df_ranking = df_mercados.sort_values("Total + viagem (R$)")

            with pd.ExcelWriter(caminho, engine="xlsxwriter") as writer:
                df_mercados.to_excel(
                    writer, sheet_name="Totais por mercado", index=False
                )
                df_itens.to_excel(
                    writer, sheet_name="Produtos por mercado", index=False
                )
                df_ranking.to_excel(
                    writer, sheet_name="Ranking economia", index=False
                )

            base, _ = os.path.splitext(caminho)
            png_path = base + ".png"
            pdf_path = base + ".pdf"

            self.fig.savefig(png_path, dpi=150)
            self.fig.savefig(pdf_path)

            messagebox.showinfo(
                "Sucesso",
                f"Relatório salvo em:\n{caminho}\n\n"
                f"Gráficos salvos em:\n{png_path}\n{pdf_path}",
            )

        except Exception as e:
            messagebox.showerror("Erro ao exportar", str(e))


# ==========================
# MAIN
# ==========================

if __name__ == "__main__":
    app = App()
    app.mainloop()
