# backend/src/worker_csv.py
import sys
import os
import csv
import psycopg2

# Configurações do Banco
DB_HOST = os.getenv("DB_HOST", "76.13.173.70")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "suphelp_geo")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "***REMOVED***")

# Mapeamento flexível de nomes de colunas
COLUMN_MAP = {
    # nome
    'name': 'name', 'nome': 'name', 'Name': 'name', 'Nome': 'name',
    # endereço
    'address': 'address', 'endereco': 'address', 'Endereço': 'address',
    'Endereco': 'address', 'Address': 'address', 'endereço': 'address',
    # categoria
    'category': 'category', 'categoria': 'category', 'Categoria': 'category',
    'Category': 'category', 'tipo': 'category', 'Tipo': 'category',
    # latitude
    'lat': 'lat', 'latitude': 'lat', 'Latitude': 'lat', 'Lat': 'lat',
    # longitude
    'lon': 'lon', 'lng': 'lon', 'longitude': 'lon', 'Longitude': 'lon',
    'Lon': 'lon', 'Lng': 'lon',
    # telefone
    'phone': 'phone', 'telefone': 'phone', 'Telefone': 'phone',
    'Phone': 'phone', 'tel': 'phone', 'Tel': 'phone',
    # rating
    'rating': 'rating', 'Rating': 'rating', 'nota': 'rating', 'Nota': 'rating',
    # numero (ignorado)
    'numero': 'numero', 'Numero': 'numero', 'Número': 'numero',
    'número': 'numero', 'id': 'numero', 'ID': 'numero', 'Id': 'numero',
    # distancia (ignorado)
    'distancia': 'distancia', 'Distância': 'distancia', 'Distancia': 'distancia',
    'distância': 'distancia', 'Distance': 'distancia',
}

def normalize_columns(headers):
    """Mapeia os nomes das colunas do CSV para nomes padronizados"""
    mapping = {}
    for i, h in enumerate(headers):
        h_clean = h.strip().strip('\ufeff')  # Remove BOM e espaços
        if h_clean in COLUMN_MAP:
            mapping[COLUMN_MAP[h_clean]] = i
        else:
            # Tenta match parcial
            h_lower = h_clean.lower()
            for key, val in COLUMN_MAP.items():
                if key.lower() == h_lower:
                    mapping[val] = i
                    break
    return mapping

def get_val(row, col_map, field, default=''):
    """Pega valor de uma coluna mapeada"""
    if field in col_map and col_map[field] < len(row):
        val = row[col_map[field]].strip()
        return val if val else default
    return default

def parse_float(val):
    """Converte string para float, tratando formatos brasileiros e internacionais.
    Exemplos que precisa tratar:
      -23.1858         -> -23.1858  (formato normal)
      -231.842.640     -> -23.1842640  (formato BR com ponto como milhar)
      -231.842,640     -> -23.1842640  (formato BR com vírgula decimal)
      -46.881.040.399  -> -46.881040399  (formato BR)
      -23,1858         -> -23.1858  (vírgula como decimal)
    """
    if not val:
        return None
    val = val.strip()
    if not val:
        return None
    
    # Guarda o sinal
    negative = val.startswith('-')
    val = val.lstrip('-').strip()
    
    # Conta pontos e vírgulas
    num_dots = val.count('.')
    num_commas = val.count(',')
    
    if num_commas == 1 and num_dots >= 1:
        # Formato: -231.842,640 -> pontos são milhar, vírgula é decimal
        val = val.replace('.', '').replace(',', '.')
    elif num_commas == 1 and num_dots == 0:
        # Formato: -23,1858 -> vírgula é decimal
        val = val.replace(',', '.')
    elif num_dots > 1:
        # Formato: -231.842.640 -> múltiplos pontos = separador de milhar
        # Mantém apenas o primeiro ponto como decimal
        parts = val.split('.')
        val = parts[0] + '.' + ''.join(parts[1:])
    # else: formato normal com 1 ponto ou nenhum
    
    # Remove qualquer caractere não numérico restante
    cleaned = ''
    dot_found = False
    for c in val:
        if c == '.' and not dot_found:
            cleaned += c
            dot_found = True
        elif c in '0123456789':
            cleaned += c
    
    if not cleaned:
        return None
    
    try:
        result = float(cleaned)
        if negative:
            result = -result
        
        # Validação: coordenadas devem estar em faixas válidas
        # Latitude: -90 a 90, Longitude: -180 a 180
        # Se o valor absoluto for > 180, provavelmente tem problema de formato
        if abs(result) > 180:
            # Tenta dividir por potências de 10 para encontrar valor válido
            temp = result
            while abs(temp) > 180:
                temp = temp / 10
            result = temp
        
        return result
    except ValueError:
        return None

def import_csv(file_path):
    conn = None
    try:
        # 1. Detecta delimitador e lê o CSV
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            sample = f.read(4096)
            f.seek(0)
            
            # Detecta delimitador (vírgula ou ponto-e-vírgula)
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample, delimiters=',;\t')
                delimiter = dialect.delimiter
            except csv.Error:
                delimiter = ','
            
            print(f"📋 Delimitador detectado: '{delimiter}'")
            
            reader = csv.reader(f, delimiter=delimiter)
            
            # Lê header
            headers = next(reader)
            col_map = normalize_columns(headers)
            
            print(f"📋 Colunas encontradas: {[h.strip() for h in headers]}")
            print(f"📋 Mapeamento: {col_map}")
            
            # Verifica colunas obrigatórias
            if 'name' not in col_map:
                print("❌ Coluna 'name' ou 'Nome' não encontrada no CSV")
                sys.exit(1)
            
            if 'lat' not in col_map or 'lon' not in col_map:
                print("❌ Colunas de latitude/longitude não encontradas no CSV")
                print("   Esperado: lat/latitude e lon/lng/longitude")
                sys.exit(1)
            
            # Lê todas as linhas
            rows = list(reader)
        
        print(f"📄 {len(rows)} registros encontrados.")

        if len(rows) == 0:
            print("Sucesso: 0")
            print("Duplicados: 0")
            print("Erros: 0")
            print("Total processado: 0")
            return

        # 2. Conecta no Banco
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT,
            database=DB_NAME, user=DB_USER, password=DB_PASS
        )
        cur = conn.cursor()

        sucesso = 0
        duplicados = 0
        erros = 0

        # 3. Itera sobre as linhas
        for index, row in enumerate(rows):
            try:
                name = get_val(row, col_map, 'name')
                if not name:
                    erros += 1
                    continue

                address = get_val(row, col_map, 'address')
                category = get_val(row, col_map, 'category', 'Importado')
                phone = get_val(row, col_map, 'phone')
                
                lat_raw = get_val(row, col_map, 'lat')
                lon_raw = get_val(row, col_map, 'lon')
                lat = parse_float(lat_raw)
                lon = parse_float(lon_raw)
                rating_val = parse_float(get_val(row, col_map, 'rating'))

                if lat is None or lon is None:
                    print(f"⚠️ Linha {index + 2}: Coordenadas inválidas para '{name}' (lat_raw='{lat_raw}', lon_raw='{lon_raw}')")
                    erros += 1
                    continue
                
                if abs(lat) > 90 or abs(lon) > 180:
                    print(f"⚠️ Linha {index + 2}: Coordenadas fora da faixa para '{name}' (lat={lat}, lon={lon})")
                    erros += 1
                    continue

                # Verifica duplicata por nome (case-insensitive)
                cur.execute(
                    "SELECT id FROM places WHERE LOWER(name) = LOWER(%s) LIMIT 1",
                    (name,)
                )
                if cur.fetchone():
                    duplicados += 1
                    continue

                # Insere novo lugar
                cur.execute(
                    """INSERT INTO places (name, address, category, phone, rating, location)
                    VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    RETURNING id""",
                    (name, address, category, phone or None, rating_val, lon, lat)
                )
                result = cur.fetchone()
                if result:
                    sucesso += 1

            except Exception as e:
                print(f"❌ Linha {index + 2}: {e}")
                erros += 1

        conn.commit()
        cur.close()

        print(f"\n✅ Importação Finalizada!")
        print(f"Sucesso: {sucesso}")
        print(f"Duplicados: {duplicados}")
        print(f"Erros: {erros}")
        print(f"Total processado: {len(rows)}")

    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro Crítico: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    arquivo = sys.argv[1] if len(sys.argv) > 1 else 'dados.csv'
    import_csv(arquivo)
