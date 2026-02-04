import os
import tkinter as tk
from tkinter import ttk, messagebox

import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg


# ==========================
# CONFIGURAÇÕES GERAIS
# ==========================
CAMINHO_ARQUIVO = "/home/diego/historias/listacompra.xlsx"

# Lista dos atacados em Jundiaí que você quer comparar
ATACADOS_JUNDIAI = [
    "Atacadão Jundiaí",
    "Assaí Atacadista Jundiaí",
    "Tenda Atacado Jundiaí",
    "Roldão Atacadista Jundiaí",
]


# ==========================
# LÓGICA DE NEGÓCIO
# ==========================

def carregar_lista_compras(caminho=CAMINHO_ARQUIVO):
    """
    Carrega o XLSX mesmo que não tenha cabeçalho.
    - Remove linhas totalmente vazias
    - Remove colunas totalmente vazias
    - Assume: 1ª coluna = produto, 2ª coluna = quantidade
    """
    import os
    import pandas as pd

    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    # Lê SEM cabeçalho
    df = pd.read_excel(caminho, header=None)

    # Remove linhas e colunas totalmente vazias
    df = df.dropna(how="all")          # linhas vazias
    df = df.dropna(axis=1, how="all")  # colunas vazias

    if df.shape[1] < 2:
        raise ValueError(
            f"A planilha precisa ter pelo menos 2 colunas com dados "
            f"para produto e quantidade. Formato atual: {df.shape[1]} colunas."
        )

    # Agora, vamos assumir:
    # primeira coluna com dados = produto
    # segunda coluna com dados = quantidade
    col_produto = df.columns[0]
    col_quantidade = df.columns[1]

    df = df.rename(columns={
        col_produto: "produto",
        col_quantidade: "quantidade"
    })

    # Garante que quantidade é numérica
    df["quantidade"] = pd.to_numeric(df["quantidade"], errors="coerce").fillna(0)

    return df[["produto", "quantidade"]]


def buscar_precos_na_web(nome_atacado, lista_produtos):
    """
    FUNÇÃO DE EXEMPLO / MOCK:
    -------------------------
    Aqui você deveria implementar a lógica real de busca de preços:
      - Chamando APIs oficiais dos mercados (se existirem)
      - Lendo um CSV/Excel exportado do site
      - OU implementando scraping específico (requests + BeautifulSoup, Selenium, etc.)
        sempre respeitando o robots.txt e os termos de uso de cada site.

    Neste exemplo, vou SIMULAR preços aleatórios por produto, apenas para
    demonstrar o funcionamento do programa.
    """
    import random

    precos = {}
    for produto in lista_produtos:
        # Simula um preço entre 3 e 50 reais
        precos[produto] = round(random.uniform(3.0, 50.0), 2)

    return precos


def calcular_totais(df_lista, mercados=ATACADOS_JUNDIAI):
    """
    Para cada mercado:
      - Busca o preço de cada produto
      - Calcula o total (quantidade * preço_unitário)
    Retorna:
      - dict_totais: {mercado: total}
      - dict_detalhes: {mercado: [{produto, qtd, preco, subtotal}, ...]}
    """
    produtos = df_lista["produto"].tolist()
    dict_totais = {}
    dict_detalhes = {}

    for mercado in mercados:
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
# INTERFACE TKINTER
# ==========================

class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Comparador de Atacados - Jundiaí")
        self.geometry("1000x600")

        # Data
        self.df_lista = None
        self.dict_totais = {}
        self.dict_detalhes = {}

        # Widgets
        self.create_widgets()

    def create_widgets(self):
        # Frame de controles
        frame_top = ttk.Frame(self)
        frame_top.pack(side=tk.TOP, fill=tk.X, padx=10, pady=10)

        btn_carregar = ttk.Button(frame_top, text="Carregar lista de compras",
                                  command=self.on_carregar_lista)
        btn_carregar.pack(side=tk.LEFT, padx=5)

        btn_buscar = ttk.Button(frame_top, text="Buscar preços e comparar",
                                command=self.on_buscar_precos)
        btn_buscar.pack(side=tk.LEFT, padx=5)

        self.lbl_status = ttk.Label(frame_top, text="Status: aguardando ação...")
        self.lbl_status.pack(side=tk.LEFT, padx=20)

        # Frame da tabela
        frame_table = ttk.Frame(self)
        frame_table.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        colunas = ("mercado", "total")
        self.tree = ttk.Treeview(frame_table, columns=colunas, show="headings")
        self.tree.heading("mercado", text="Mercado")
        self.tree.heading("total", text="Total (R$)")

        self.tree.column("mercado", width=200)
        self.tree.column("total", width=100)

        self.tree.pack(fill=tk.BOTH, expand=True)

        # Frame do gráfico
        frame_chart = ttk.Frame(self)
        frame_chart.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.fig, self.ax = plt.subplots(figsize=(5, 4))
        self.canvas = FigureCanvasTkAgg(self.fig, master=frame_chart)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    # ======== Handlers ========

    def on_carregar_lista(self):
        try:
            self.df_lista = carregar_lista_compras()
            self.lbl_status.config(text=f"Lista carregada com sucesso de: {CAMINHO_ARQUIVO}")
            messagebox.showinfo("Sucesso", "Lista de compras carregada com sucesso!")
        except Exception as e:
            messagebox.showerror("Erro ao carregar lista", str(e))
            self.lbl_status.config(text="Erro ao carregar lista.")

    def on_buscar_precos(self):
        if self.df_lista is None:
            messagebox.showwarning("Atenção", "Carregue primeiro a lista de compras.")
            return

        try:
            self.lbl_status.config(text="Buscando preços (simulado)...")
            self.update_idletasks()

            self.dict_totais, self.dict_detalhes = calcular_totais(self.df_lista)

            # Atualiza tabela
            for item in self.tree.get_children():
                self.tree.delete(item)

            for mercado, total in self.dict_totais.items():
                self.tree.insert("", tk.END, values=(mercado, f"{total:.2f}"))

            # Atualiza gráfico
            self.atualizar_grafico()

            melhor_mercado = min(self.dict_totais, key=self.dict_totais.get)
            melhor_valor = self.dict_totais[melhor_mercado]
            self.lbl_status.config(
                text=f"Melhor opção: {melhor_mercado} (R$ {melhor_valor:.2f})"
            )

        except Exception as e:
            messagebox.showerror("Erro", str(e))
            self.lbl_status.config(text="Erro ao buscar preços.")

    def atualizar_grafico(self):
        self.ax.clear()

        mercados = list(self.dict_totais.keys())
        totais = list(self.dict_totais.values())

        if not mercados:
            return

        # Barra simples
        self.ax.bar(mercados, totais)
        self.ax.set_title("Comparação de totais por atacado (R$)")
        self.ax.set_ylabel("Total (R$)")
        self.ax.tick_params(axis='x', rotation=15)

        # Destaca o menor valor
        idx_min = min(range(len(totais)), key=lambda i: totais[i])
        melhor_mercado = mercados[idx_min]
        melhor_valor = totais[idx_min]

        self.ax.text(
            idx_min,
            melhor_valor,
            f"Menor: {melhor_valor:.2f}",
            ha="center",
            va="bottom",
            fontweight="bold"
        )

        self.fig.tight_layout()
        self.canvas.draw()


# ==========================
# MAIN
# ==========================

if __name__ == "__main__":
    app = App()
    app.mainloop()
