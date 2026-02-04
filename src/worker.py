# backend/src/worker.py
import sys
import os
import psycopg2

# 1. Pega as configurações do ambiente
DB_HOST = os.getenv("DB_HOST", "76.13.173.70")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "suphelp_geo")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "***REMOVED***")

def run_import():
    try:
        # 2. Conecta no Banco
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        # 3. Dados de Teste (Marco Zero - Praça da Sé, SP)
        # Latitude: -23.5505, Longitude: -46.6333
        place_name = "Marco Zero - Teste Python"
        lat = -23.5505
        lon = -46.6333

        # 4. Inserção SQL com PostGIS (ST_MakePoint)
        # ST_SetSRID(ST_MakePoint(lon, lat), 4326) cria o ponto geográfico correto
        query = """
            INSERT INTO places (name, address, category, location)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            RETURNING id;
        """
        
        cur.execute(query, (place_name, "Praça da Sé, SP", "Teste", lon, lat))
        new_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()

        print(f"SUCESSO: Local inserido via Python! ID: {new_id}")

    except Exception as e:
        print(f"ERRO no Python: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Iniciando Worker Python...")
    run_import()
