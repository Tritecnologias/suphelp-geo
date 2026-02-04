#!/usr/bin/env python3
"""
Busca condomínios/prédios residenciais em Jundiaí-SP usando Google Places Text Search
e gera um CSV com nome, endereço e coordenadas.

Opcional:
- Se existir 'populacao_condominios_jundiai.csv' (com coluna 'nome' e 'populacao_estimada'),
  faz merge e gera:
  - condominios_jundiai_com_populacao.csv
  - condominios_jundiai_maiores_750.csv
"""

from __future__ import annotations

import os
import time
import logging
from typing import Dict, List
from pathlib import Path

import requests
import pandas as pd
from dotenv import load_dotenv

# -------------------------
# Carregar .env local
# -------------------------
BASE_DIR = Path(__file__).resolve().parent
DOTENV_PATH = BASE_DIR / ".env"

# Carrega variáveis do .env (NÃO comente isso)
load_dotenv(dotenv_path=DOTENV_PATH)

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_MAPS_API_KEY não encontrada.\n"
        f"Verifique o arquivo {DOTENV_PATH} e garanta que contém:\n"
        "GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI"
    )

# Debug opcional (pode remover depois)
print(
    "API KEY carregada:",
    GOOGLE_API_KEY[:6], "...", GOOGLE_API_KEY[-4:],
    "tam:", len(GOOGLE_API_KEY)
)

PLACES_URL_NEW = "https://places.googleapis.com/v1/places:searchText"

SEARCH_KEYWORDS = [
    "condomínio residencial",
    "condomínio clube",
    "residencial clube",
    "condomínio vertical",
    "condomínio fechado",
]
CITY_QUERY = "Jundiaí - SP, Brasil"

OUTPUT_CSV = "condominios_jundiai_google_places.csv"
CSV_POP = "populacao_condominios_jundiai.csv"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def call_places_textsearch(query: str) -> List[Dict]:
    """
    Places API (New) - Text Search.
    Retorna uma lista no formato parecido com o que o resto do script espera.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # FieldMask é obrigatório no Places (New)
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.types"
        ),
    }

    payload = {
        "textQuery": query,
        "languageCode": "pt-BR",
        # opcional: para tentar limitar melhor
        "regionCode": "BR",
    }

    logging.info(f"Places (New) searchText: {query!r}")
    resp = requests.post(PLACES_URL_NEW, json=payload, headers=headers, timeout=20)
    data = resp.json()

    # Erros no formato novo vêm como "error"
    if resp.status_code != 200:
        msg = data.get("error", {}).get("message") or str(data)
        raise RuntimeError(f"Erro Places (New) HTTP {resp.status_code}: {msg}")

    places = data.get("places", []) or []
    results: List[Dict] = []

    for p in places:
        loc = p.get("location", {}) or {}
        display = (p.get("displayName", {}) or {}).get("text", "")

        # Adaptando para o formato que o resto do seu script usa
        results.append({
            "place_id": p.get("id"),
            "name": display,
            "formatted_address": p.get("formattedAddress", ""),
            "geometry": {"location": {"lat": loc.get("latitude"), "lng": loc.get("longitude")}},
            "types": p.get("types", []),
        })

    logging.info(f"Resultados retornados (Places New): {len(results)}")
    return results



def collect_condos_in_jundiai() -> pd.DataFrame:
    """Consolida resultados de múltiplas keywords removendo duplicados por place_id."""
    aggregated: Dict[str, Dict] = {}

    for kw in SEARCH_KEYWORDS:
        query = f"{kw} {CITY_QUERY}"
        results = call_places_textsearch(query)

        for r in results:
            place_id = r.get("place_id")
            if not place_id or place_id in aggregated:
                continue

            location = r.get("geometry", {}).get("location", {})
            aggregated[place_id] = {
                "place_id": place_id,
                "nome": r.get("name"),
                "endereco": r.get("formatted_address"),
                "lat": location.get("lat"),
                "lng": location.get("lng"),
                "types": ",".join(r.get("types", [])),
            }

    df = pd.DataFrame(list(aggregated.values()))
    if not df.empty:
        df = df.sort_values("nome").reset_index(drop=True)
        df["populacao_estimada"] = pd.NA
    return df


def merge_populacao(df: pd.DataFrame, csv_pop: str) -> pd.DataFrame:
    """Merge opcional com CSV de população (colunas esperadas: nome, populacao_estimada)."""
    if not os.path.exists(csv_pop):
        logging.warning(f"CSV de população não encontrado: {csv_pop}")
        return df

    df_pop = pd.read_csv(csv_pop)

    if "nome" not in df_pop.columns:
        raise ValueError("CSV de população precisa ter a coluna 'nome'.")
    if "populacao_estimada" not in df_pop.columns:
        raise ValueError("CSV de população precisa ter a coluna 'populacao_estimada'.")

    df_merged = df.drop(columns=["populacao_estimada"], errors="ignore").merge(
        df_pop[["nome", "populacao_estimada"]],
        on="nome",
        how="left",
    )
    return df_merged


def main() -> None:
    logging.info("Iniciando busca de condomínios/prédios em Jundiaí (Google Places)...")
    df = collect_condos_in_jundiai()

    if df.empty:
        logging.warning("Nenhum resultado encontrado. Verifique API key e limites.")
        return

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    logging.info(f"{len(df)} registros salvos em {OUTPUT_CSV!r}.")

    print("\nPrévia dos dados coletados:")
    print(df.head(10))

    # Pós-processamento (opcional)
    try:
        df_merged = merge_populacao(df, CSV_POP)
        df_merged.to_csv("condominios_jundiai_com_populacao.csv", index=False, encoding="utf-8-sig")
        logging.info("Gerado: 'condominios_jundiai_com_populacao.csv'.")

        if "populacao_estimada" in df_merged.columns:
            df_grandes = df_merged[df_merged["populacao_estimada"] >= 750]
            df_grandes.to_csv("condominios_jundiai_maiores_750.csv", index=False, encoding="utf-8-sig")
            logging.info(f"Gerado: 'condominios_jundiai_maiores_750.csv' ({len(df_grandes)} registros).")

            print("\nCondomínios com >= 750 moradores (prévia):")
            print(df_grandes[["nome", "endereco", "populacao_estimada"]].head(20))
    except Exception as e:
        logging.error(f"Erro no pós-processamento: {e}")


if __name__ == "__main__":
    main()
