#!/usr/bin/env python3
"""
Worker para enriquecer lugares existentes com telefone via Google Place Details API.
Baseado no código do Diego (mapeamentojundiai.py).

Uso:
    python3 src/worker_enrich_contacts.py <place_ids>
    
Exemplo:
    python3 src/worker_enrich_contacts.py "ChIJ...,ChIJ...,ChIJ..."
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
PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places"

# Configurações
MAX_RETRIES = 3
BACKOFF_BASE = 1.5
SLEEP_BETWEEN_CALLS = 0.5  # Respeita rate limit

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class EnrichmentError(Exception):
    """Erro customizado para enriquecimento"""
    pass


def validate_api_key():
    """Valida se a API key está configurada"""
    if not GOOGLE_API_KEY:
        raise EnrichmentError(
            "GOOGLE_PLACES_API_KEY não encontrada no .env\n"
            "Configure: GOOGLE_PLACES_API_KEY=sua_chave_aqui"
        )


def get_place_details(place_id: str) -> Dict:
    """
    Busca detalhes de um lugar via Place Details API (New)
    
    Args:
        place_id: ID do lugar no Google Places
        
    Returns:
        Dicionário com telefone e outros dados
    """
    # Remove prefixo "places/" se existir
    clean_place_id = place_id.replace("places/", "")
    
    url = f"{PLACE_DETAILS_URL}/{clean_place_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": (
            "id,"
            "displayName,"
            "formattedAddress,"
            "nationalPhoneNumber,"
            "internationalPhoneNumber,"
            "websiteUri,"
            "rating,"
            "userRatingCount,"
            "currentOpeningHours"
        ),
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.debug(f"Buscando detalhes: {clean_place_id} (tentativa {attempt}/{MAX_RETRIES})")
            
            resp = requests.get(
                url,
                headers=headers,
                timeout=15
            )

            if resp.status_code == 200:
                data = resp.json()
                
                # Extrai telefone (prioriza nacional)
                phone = data.get("nationalPhoneNumber") or data.get("internationalPhoneNumber")
                
                # Extrai outros dados
                website = data.get("websiteUri")
                rating = data.get("rating")
                user_ratings_total = data.get("userRatingCount")
                
                # Horário de funcionamento
                opening_hours = data.get("currentOpeningHours", {})
                open_now = opening_hours.get("openNow")
                
                return {
                    "phone": phone or "",
                    "website": website or "",
                    "rating": rating,
                    "user_ratings_total": user_ratings_total,
                    "open_now": open_now,
                    "status": "OK"
                }
            
            elif resp.status_code == 404:
                logger.warning(f"⚠️  Place ID não encontrado: {clean_place_id}")
                return {"status": "NOT_FOUND"}
            
            elif resp.status_code == 400:
                logger.error(f"❌ Place ID inválido: {clean_place_id}")
                return {"status": "INVALID"}

            # Erros recuperáveis (retry)
            if resp.status_code in (429, 500, 502, 503, 504):
                wait_time = BACKOFF_BASE ** attempt
                logger.warning(
                    f"⚠️  HTTP {resp.status_code}. Aguardando {wait_time:.1f}s..."
                )
                time.sleep(wait_time)
                continue

            # Erro não recuperável
            error_data = resp.json() if resp.headers.get('content-type') == 'application/json' else {}
            error_msg = error_data.get("error", {}).get("message", resp.text[:200])
            logger.error(f"❌ HTTP {resp.status_code}: {error_msg}")
            return {"status": "ERROR"}

        except requests.Timeout:
            wait_time = BACKOFF_BASE ** attempt
            logger.warning(f"⏱️  Timeout. Aguardando {wait_time:.1f}s...")
            time.sleep(wait_time)
        except requests.ConnectionError as e:
            wait_time = BACKOFF_BASE ** attempt
            logger.warning(f"🔌 Erro de conexão: {e}. Aguardando {wait_time:.1f}s...")
            time.sleep(wait_time)

    logger.error(f"❌ Falha após {MAX_RETRIES} tentativas para {clean_place_id}")
    return {"status": "ERROR"}


def get_places_from_database(place_ids: Optional[List[str]] = None, limit: int = 50) -> List[Dict]:
    """
    Busca lugares no banco que precisam de enriquecimento
    
    Args:
        place_ids: Lista de place_ids específicos (opcional)
        limit: Limite de registros (se place_ids não fornecido)
        
    Returns:
        Lista de lugares do banco
    """
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        if place_ids:
            # Busca place_ids específicos
            placeholders = ','.join(['%s'] * len(place_ids))
            query = f"""
                SELECT id, name, google_place_id, address
                FROM places
                WHERE google_place_id IN ({placeholders})
                ORDER BY id DESC
            """
            cur.execute(query, place_ids)
        else:
            # Busca lugares sem telefone (ou todos se não tiver coluna phone)
            query = """
                SELECT id, name, google_place_id, address
                FROM places
                WHERE google_place_id IS NOT NULL 
                  AND google_place_id != ''
                ORDER BY id DESC
                LIMIT %s
            """
            cur.execute(query, (limit,))
        
        rows = cur.fetchall()
        cur.close()
        
        places = []
        for row in rows:
            places.append({
                "id": row[0],
                "name": row[1],
                "google_place_id": row[2],
                "address": row[3]
            })
        
        logger.info(f"📋 {len(places)} lugares encontrados no banco")
        return places
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar lugares: {e}")
        raise
    finally:
        if conn:
            conn.close()


def update_place_in_database(place_id: int, details: Dict) -> bool:
    """
    Atualiza lugar no banco com dados enriquecidos
    
    Args:
        place_id: ID do lugar no banco (não é google_place_id)
        details: Dicionário com dados do Place Details
        
    Returns:
        True se atualizado com sucesso
    """
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        # Verifica se colunas existem, se não, cria
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'places' AND column_name IN ('phone', 'website', 'rating', 'user_ratings_total')
        """)
        existing_columns = [row[0] for row in cur.fetchall()]
        
        # Adiciona colunas se não existirem
        if 'phone' not in existing_columns:
            cur.execute("ALTER TABLE places ADD COLUMN phone VARCHAR(50)")
            logger.info("✅ Coluna 'phone' criada")
        
        if 'website' not in existing_columns:
            cur.execute("ALTER TABLE places ADD COLUMN website TEXT")
            logger.info("✅ Coluna 'website' criada")
        
        if 'rating' not in existing_columns:
            cur.execute("ALTER TABLE places ADD COLUMN rating DECIMAL(2,1)")
            logger.info("✅ Coluna 'rating' criada")
        
        if 'user_ratings_total' not in existing_columns:
            cur.execute("ALTER TABLE places ADD COLUMN user_ratings_total INTEGER")
            logger.info("✅ Coluna 'user_ratings_total' criada")
        
        # Atualiza o lugar
        query = """
            UPDATE places
            SET phone = %s,
                website = %s,
                rating = %s,
                user_ratings_total = %s
            WHERE id = %s
        """
        
        cur.execute(query, (
            details.get("phone"),
            details.get("website"),
            details.get("rating"),
            details.get("user_ratings_total"),
            place_id
        ))
        
        conn.commit()
        cur.close()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar lugar {place_id}: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def enrich_places(place_ids: Optional[List[str]] = None, limit: int = 50) -> Dict:
    """
    Enriquece lugares com dados do Google Place Details
    
    Args:
        place_ids: Lista de place_ids específicos (opcional)
        limit: Limite de registros (se place_ids não fornecido)
        
    Returns:
        Estatísticas do enriquecimento
    """
    validate_api_key()
    
    stats = {
        "total": 0,
        "enriched": 0,
        "not_found": 0,
        "errors": 0,
        "api_calls": 0
    }
    
    # Busca lugares no banco
    places = get_places_from_database(place_ids, limit)
    stats["total"] = len(places)
    
    if not places:
        logger.warning("⚠️  Nenhum lugar para enriquecer")
        return stats
    
    logger.info(f"🔍 Iniciando enriquecimento de {len(places)} lugares...")
    
    for idx, place in enumerate(places, 1):
        place_db_id = place["id"]
        google_place_id = place["google_place_id"]
        name = place["name"]
        
        logger.info(f"[{idx}/{len(places)}] {name}")
        
        # Busca detalhes na API
        details = get_place_details(google_place_id)
        stats["api_calls"] += 1
        
        if details.get("status") == "OK":
            # Atualiza no banco
            if update_place_in_database(place_db_id, details):
                stats["enriched"] += 1
                
                phone = details.get("phone", "Sem telefone")
                rating = details.get("rating", "-")
                logger.info(f"   ✅ Enriquecido: {phone} | Rating: {rating}")
            else:
                stats["errors"] += 1
                logger.error(f"   ❌ Erro ao atualizar no banco")
        
        elif details.get("status") == "NOT_FOUND":
            stats["not_found"] += 1
            logger.warning(f"   ⚠️  Não encontrado na API")
        
        else:
            stats["errors"] += 1
            logger.error(f"   ❌ Erro ao buscar detalhes")
        
        # Respeita rate limit
        if idx < len(places):
            time.sleep(SLEEP_BETWEEN_CALLS)
    
    logger.info("="*70)
    logger.info("📊 RESULTADO DO ENRIQUECIMENTO")
    logger.info("="*70)
    logger.info(f"Total processado: {stats['total']}")
    logger.info(f"Enriquecidos: {stats['enriched']}")
    logger.info(f"Não encontrados: {stats['not_found']}")
    logger.info(f"Erros: {stats['errors']}")
    logger.info(f"Chamadas à API: {stats['api_calls']}")
    logger.info("="*70)
    
    return stats


def main():
    """Função principal (CLI)"""
    logger.info("="*70)
    logger.info("📞 Worker de Enriquecimento - SupHelp Geo")
    logger.info("="*70)
    
    # Parse argumentos
    if len(sys.argv) < 2:
        logger.info("ℹ️  Uso: python3 worker_enrich_contacts.py <place_ids> [limit]")
        logger.info("   place_ids: IDs separados por vírgula ou 'all' para todos")
        logger.info("   limit: Número máximo de lugares (padrão: 50)")
        logger.info("")
        logger.info("Exemplos:")
        logger.info("   python3 worker_enrich_contacts.py 'ChIJ...,ChIJ...'")
        logger.info("   python3 worker_enrich_contacts.py all 20")
        logger.info("")
        logger.info("🔄 Processando últimos 10 lugares por padrão...")
        place_ids = None
        limit = 10
    else:
        place_ids_str = sys.argv[1]
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        
        if place_ids_str.lower() == "all":
            place_ids = None
        else:
            place_ids = [pid.strip() for pid in place_ids_str.split(",") if pid.strip()]
    
    try:
        # Executa enriquecimento
        stats = enrich_places(place_ids, limit)
        
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
