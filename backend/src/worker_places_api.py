#!/usr/bin/env python3
"""
Worker para buscar lugares via Google Places API (New) e salvar no PostgreSQL.
Baseado no código do Diego (mapeamentojundiainovo.py).

Uso:
    python3 src/worker_places_api.py <cidade> <keywords> <max_results>
    
Exemplo:
    python3 src/worker_places_api.py "Jundiaí, SP" "condomínio,mercado" 50
"""

import sys
import os
import json
import time
import logging
from typing import Dict, List, Optional

import requests
import psycopg2
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configurações do Banco
DB_HOST = os.getenv("DB_HOST", "76.13.173.70")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "suphelp_geo")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "***REMOVED***")

# Google Places API
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")
PLACES_URL = "https://places.googleapis.com/v1/places:searchText"

# Configurações
MAX_RETRIES = 3
BACKOFF_BASE = 1.5
SLEEP_BETWEEN_CALLS = 0.3

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class PlacesAPIError(Exception):
    """Erro customizado para Places API"""
    pass


def validate_api_key():
    """Valida se a API key está configurada"""
    if not GOOGLE_API_KEY:
        raise PlacesAPIError(
            "GOOGLE_PLACES_API_KEY não encontrada no .env\n"
            "Configure: GOOGLE_PLACES_API_KEY=sua_chave_aqui"
        )


def call_places_api(query: str, max_results: int = 20) -> List[Dict]:
    """
    Chama Google Places API (New) - Text Search
    
    Args:
        query: Texto de busca (ex: "condomínio residencial Jundiaí, SP")
        max_results: Número máximo de resultados
        
    Returns:
        Lista de lugares encontrados
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.types,"
            "places.rating,"
            "places.userRatingCount"
        ),
    }

    payload = {
        "textQuery": query,
        "languageCode": "pt-BR",
        "regionCode": "BR",
        "pageSize": min(max_results, 20),  # API limita a 20 por página
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Buscando: {query!r} (tentativa {attempt}/{MAX_RETRIES})")
            
            resp = requests.post(
                PLACES_URL,
                json=payload,
                headers=headers,
                timeout=20
            )

            if resp.status_code == 200:
                data = resp.json()
                places = data.get("places", [])
                logger.info(f"✅ {len(places)} lugares encontrados")
                return adapt_places_response(places)

            # Erros recuperáveis (retry)
            if resp.status_code in (429, 500, 502, 503, 504):
                wait_time = BACKOFF_BASE ** attempt
                logger.warning(
                    f"⚠️  HTTP {resp.status_code}. Aguardando {wait_time:.1f}s..."
                )
                time.sleep(wait_time)
                continue

            # Erro não recuperável
            error_msg = extract_error_message(resp)
            raise PlacesAPIError(f"HTTP {resp.status_code}: {error_msg}")

        except requests.Timeout:
            wait_time = BACKOFF_BASE ** attempt
            logger.warning(f"⏱️  Timeout. Aguardando {wait_time:.1f}s...")
            time.sleep(wait_time)
        except requests.ConnectionError as e:
            wait_time = BACKOFF_BASE ** attempt
            logger.warning(f"🔌 Erro de conexão: {e}. Aguardando {wait_time:.1f}s...")
            time.sleep(wait_time)

    raise PlacesAPIError(f"Falha após {MAX_RETRIES} tentativas")


def extract_error_message(resp: requests.Response) -> str:
    """Extrai mensagem de erro da resposta"""
    try:
        data = resp.json()
        return data.get("error", {}).get("message", str(data))
    except Exception:
        return resp.text[:200]


def adapt_places_response(places: List[Dict]) -> List[Dict]:
    """
    Adapta resposta da API para formato interno
    
    Args:
        places: Lista de lugares da API
        
    Returns:
        Lista adaptada com campos padronizados
    """
    results = []
    
    for p in places:
        loc = p.get("location", {}) or {}
        display = (p.get("displayName", {}) or {}).get("text", "")
        
        results.append({
            "place_id": p.get("id", ""),
            "name": display,
            "address": p.get("formattedAddress", ""),
            "lat": loc.get("latitude"),
            "lng": loc.get("longitude"),
            "types": p.get("types", []),
            "rating": p.get("rating"),
            "user_ratings_total": p.get("userRatingCount"),
        })
    
    return results


def save_to_database(places: List[Dict], category: str = "Importado") -> Dict:
    """
    Salva lugares no PostgreSQL com geometria PostGIS
    
    Args:
        places: Lista de lugares para salvar
        category: Categoria dos lugares
        
    Returns:
        Estatísticas da importação
    """
    conn = None
    stats = {"success": 0, "duplicates": 0, "errors": 0}
    
    try:
        # Conecta no banco
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        logger.info(f"💾 Salvando {len(places)} lugares no banco...")
        
        for place in places:
            try:
                name = place.get("name", "Sem nome")
                address = place.get("address", "")
                place_id = place.get("place_id", "")
                lat = place.get("lat")
                lng = place.get("lng")
                
                # Valida coordenadas
                if lat is None or lng is None:
                    logger.warning(f"⚠️  {name}: sem coordenadas, pulando...")
                    stats["errors"] += 1
                    continue
                
                # Query com UPSERT (evita duplicatas por google_place_id)
                query = """
                    INSERT INTO places (name, address, google_place_id, category, location)
                    VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    ON CONFLICT (google_place_id) 
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        address = EXCLUDED.address,
                        category = EXCLUDED.category,
                        location = EXCLUDED.location
                    RETURNING id, (xmax = 0) AS inserted;
                """
                
                cur.execute(query, (name, address, place_id, category, lng, lat))
                result = cur.fetchone()
                
                if result:
                    place_db_id, inserted = result
                    if inserted:
                        stats["success"] += 1
                        logger.debug(f"✅ Inserido: {name} (ID: {place_db_id})")
                    else:
                        stats["duplicates"] += 1
                        logger.debug(f"🔄 Atualizado: {name} (ID: {place_db_id})")
                
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"❌ Erro ao salvar {place.get('name')}: {e}")
        
        conn.commit()
        cur.close()
        
        logger.info(
            f"✅ Importação concluída: "
            f"{stats['success']} novos, "
            f"{stats['duplicates']} atualizados, "
            f"{stats['errors']} erros"
        )
        
    except Exception as e:
        logger.error(f"❌ Erro crítico no banco: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()
    
    return stats


def search_and_save(city: str, keywords: List[str], max_results: int = 50) -> Dict:
    """
    Busca lugares e salva no banco (função principal)
    
    Args:
        city: Cidade para buscar (ex: "Jundiaí, SP")
        keywords: Lista de palavras-chave (ex: ["condomínio", "mercado"])
        max_results: Máximo de resultados por keyword
        
    Returns:
        Estatísticas consolidadas
    """
    validate_api_key()
    
    all_places = {}  # Usa dict para evitar duplicatas por place_id
    total_stats = {"success": 0, "duplicates": 0, "errors": 0, "api_calls": 0}
    
    logger.info(f"🔍 Iniciando busca em {city}")
    logger.info(f"📋 Keywords: {', '.join(keywords)}")
    
    for keyword in keywords:
        query = f"{keyword} {city}"
        
        try:
            places = call_places_api(query, max_results)
            total_stats["api_calls"] += 1
            
            # Adiciona ao dicionário (evita duplicatas)
            for place in places:
                place_id = place.get("place_id")
                if place_id and place_id not in all_places:
                    all_places[place_id] = place
            
            # Respeita rate limit
            time.sleep(SLEEP_BETWEEN_CALLS)
            
        except PlacesAPIError as e:
            logger.error(f"❌ Erro na busca '{keyword}': {e}")
            total_stats["errors"] += 1
    
    # Salva no banco
    if all_places:
        logger.info(f"📊 Total de lugares únicos encontrados: {len(all_places)}")
        
        # Determina categoria baseada nas keywords
        category = ", ".join(keywords[:2]) if len(keywords) <= 2 else "Múltiplas categorias"
        
        db_stats = save_to_database(list(all_places.values()), category)
        
        # Consolida estatísticas
        total_stats["success"] = db_stats["success"]
        total_stats["duplicates"] = db_stats["duplicates"]
        total_stats["errors"] += db_stats["errors"]
    else:
        logger.warning("⚠️  Nenhum lugar encontrado")
    
    return total_stats


def main():
    """Função principal (CLI)"""
    logger.info("="*70)
    logger.info("🚀 Worker Google Places API - SupHelp Geo")
    logger.info("="*70)
    
    # Parse argumentos
    if len(sys.argv) < 3:
        logger.error(
            "❌ Uso incorreto!\n"
            "Uso: python3 worker_places_api.py <cidade> <keywords> [max_results]\n"
            "Exemplo: python3 worker_places_api.py 'Jundiaí, SP' 'condomínio,mercado' 50"
        )
        sys.exit(1)
    
    city = sys.argv[1]
    keywords_str = sys.argv[2]
    max_results = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    
    # Processa keywords
    keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]
    
    if not keywords:
        logger.error("❌ Nenhuma keyword fornecida")
        sys.exit(1)
    
    try:
        # Executa busca
        stats = search_and_save(city, keywords, max_results)
        
        # Resultado final
        logger.info("="*70)
        logger.info("📊 RESULTADO FINAL")
        logger.info("="*70)
        logger.info(f"Chamadas à API: {stats['api_calls']}")
        logger.info(f"Novos registros: {stats['success']}")
        logger.info(f"Atualizados: {stats['duplicates']}")
        logger.info(f"Erros: {stats['errors']}")
        logger.info("="*70)
        
        # Retorna JSON para o Node.js
        print(json.dumps(stats))
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
