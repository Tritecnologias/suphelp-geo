# backend/src/worker_csv.py
import sys
import os
import psycopg2
import pandas as pd
import json

# Configurações do Banco
DB_HOST = "db"
DB_NAME = os.getenv("POSTGRES_DB", "suphelp_geo")
DB_USER = os.getenv("POSTGRES_USER", "admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "***REMOVED***")

def import_csv(file_path):
    conn = None
    try:
        # 1. Lê o CSV usando Pandas
        df = pd.read_csv(file_path)
        print(f"📄 Lendo arquivo: {len(df)} registros encontrados.")

        # 2. Conecta no Banco
        conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()

        sucesso = 0
        erros = 0

        # 3. Itera sobre as linhas e salva
        for index, row in df.iterrows():
            try:
                name = row['name']
                address = row.get('address', '') # Se não tiver endereço, fica vazio
                category = row.get('category', 'Importado')
                lat = float(row['lat'])
                lon = float(row['lon'])

                # Query com UPSERT (Se já existe o mesmo nome, NÃO duplica)
                query = """
                    INSERT INTO places (name, address, category, location)
                    VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    ON CONFLICT (google_place_id) DO NOTHING
                    RETURNING id;
                """
                # Nota: Para o 'ON CONFLICT' funcionar perfeitamente, idealmente teríamos um ID único. 
                # Como é CSV simples, vamos apenas inserir por enquanto.
                
                cur.execute(query, (name, address, category, lon, lat))
                sucesso += 1
            except Exception as e:
                print(f"⚠️ Erro na linha {index}: {e}")
                erros += 1

        conn.commit()
        cur.close()
        print(f"✅ Importação Finalizada! Sucesso: {sucesso} | Falhas: {erros}")

    except FileNotFoundError:
        print("❌ Arquivo CSV não encontrado na pasta.")
    except Exception as e:
        print(f"❌ Erro Crítico: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    # Pega o nome do arquivo passado como argumento pelo Node
    arquivo = sys.argv[1] if len(sys.argv) > 1 else 'dados.csv'
    import_csv(arquivo)
