# backend/src/worker_csv.py
import sys
import os
import psycopg2
import pandas as pd
import json

# Configurações do Banco
DB_HOST = os.getenv("DB_HOST", "76.13.173.70")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "suphelp_geo")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "***REMOVED***")

def import_csv(file_path):
    conn = None
    try:
        # 1. Lê o CSV usando Pandas
        df = pd.read_csv(file_path)
        print(f"📄 Lendo arquivo: {len(df)} registros encontrados.")

        # 2. Conecta no Banco
        conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()

        sucesso = 0
        duplicados = 0
        erros = 0

        # 3. Itera sobre as linhas e salva
        for index, row in df.iterrows():
            try:
                name = row['name']
                address = row.get('address', '') # Se não tiver endereço, fica vazio
                category = row.get('category', 'Importado')
                lat = float(row['lat'])
                lon = float(row['lon'])

                # Verifica se já existe um lugar com o mesmo nome e coordenadas próximas (raio de 10 metros)
                check_query = """
                    SELECT id FROM places 
                    WHERE name = %s 
                    AND ST_DWithin(
                        location::geography,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                        10
                    )
                    LIMIT 1;
                """
                cur.execute(check_query, (name, lon, lat))
                existing = cur.fetchone()
                
                if existing:
                    duplicados += 1
                    print(f"⚠️ Linha {index + 2}: '{name}' já existe no banco (ID: {existing[0]})")
                    continue

                # Insere novo lugar
                query = """
                    INSERT INTO places (name, address, category, location)
                    VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    RETURNING id;
                """
                
                cur.execute(query, (name, address, category, lon, lat))
                result = cur.fetchone()
                
                if result:
                    sucesso += 1
                    print(f"✅ Linha {index + 2}: '{name}' importado com sucesso (ID: {result[0]})")
                
            except KeyError as e:
                print(f"❌ Linha {index + 2}: Coluna obrigatória não encontrada: {e}")
                erros += 1
            except ValueError as e:
                print(f"❌ Linha {index + 2}: Erro ao converter coordenadas: {e}")
                erros += 1
            except Exception as e:
                print(f"❌ Linha {index + 2}: Erro inesperado: {e}")
                erros += 1

        conn.commit()
        cur.close()
        
        # Imprime resumo em formato JSON para o Node.js capturar
        print(f"\n✅ Importação Finalizada!")
        print(f"Sucesso: {sucesso}")
        print(f"Duplicados: {duplicados}")
        print(f"Erros: {erros}")
        print(f"Total processado: {len(df)}")

    except FileNotFoundError:
        print(f"❌ Arquivo CSV não encontrado: {file_path}")
        sys.exit(1)
    except pd.errors.EmptyDataError:
        print("❌ Arquivo CSV está vazio")
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
    # Pega o nome do arquivo passado como argumento pelo Node
    arquivo = sys.argv[1] if len(sys.argv) > 1 else 'dados.csv'
    import_csv(arquivo)
