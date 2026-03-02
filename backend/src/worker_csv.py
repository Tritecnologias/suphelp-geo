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

def import_csv(file_path):
    conn = None
    try:
        # 1. Abre e lê o CSV usando módulo csv nativo (sem dependência de pandas)
        rows = []
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)

        print(f"📄 Lendo arquivo: {len(rows)} registros encontrados.")

        if len(rows) == 0:
            print("⚠️ Arquivo CSV vazio ou sem dados válidos")
            print("Sucesso: 0")
            print("Duplicados: 0")
            print("Erros: 0")
            print(f"Total processado: 0")
            return

        # Mostra colunas encontradas
        if rows:
            print(f"📋 Colunas: {list(rows[0].keys())}")

        # 2. Conecta no Banco
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT,
            database=DB_NAME, user=DB_USER, password=DB_PASS
        )
        cur = conn.cursor()

        sucesso = 0
        duplicados = 0
        erros = 0

        # 3. Itera sobre as linhas e salva
        for index, row in enumerate(rows):
            try:
                name = row.get('name', '').strip()
                if not name:
                    print(f"⚠️ Linha {index + 2}: Nome vazio, pulando")
                    erros += 1
                    continue

                address = row.get('address', '').strip()
                category = row.get('category', 'Importado').strip()
                
                # Tenta pegar lat/lon
                lat_str = row.get('lat', '').strip()
                lon_str = row.get('lon', row.get('lng', '')).strip()
                
                if not lat_str or not lon_str:
                    print(f"⚠️ Linha {index + 2}: Coordenadas vazias para '{name}'")
                    erros += 1
                    continue

                lat = float(lat_str)
                lon = float(lon_str)

                # Verifica duplicata por nome
                cur.execute(
                    "SELECT id FROM places WHERE LOWER(name) = LOWER(%s) LIMIT 1",
                    (name,)
                )
                existing = cur.fetchone()

                if existing:
                    duplicados += 1
                    continue

                # Insere novo lugar
                cur.execute(
                    """INSERT INTO places (name, address, category, location)
                    VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    RETURNING id""",
                    (name, address, category, lon, lat)
                )
                result = cur.fetchone()
                if result:
                    sucesso += 1

            except (ValueError, KeyError) as e:
                print(f"❌ Linha {index + 2}: {e}")
                erros += 1
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
