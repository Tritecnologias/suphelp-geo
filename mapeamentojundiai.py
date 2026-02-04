#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Coleta condomínios via Google Places API (New) places:searchText e exporta CSV.
Opcionalmente enriquece os resultados buscando CNPJ/telefone/email no cnpj.biz (best-effort).

⚠️ Observação:
- O cnpj.biz pode retornar HTTP 402 (paywall) em algumas rotas/páginas. Neste caso, o script NÃO quebra:
  apenas deixa os campos de contato vazios e segue.
"""

from __future__ import annotations

import argparse
import logging
import os
import random
import re
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"

DEFAULT_KEYWORDS = [
    "condomínio residencial",
    "condomínio clube",
    "residencial clube",
    "condomínio vertical",
    "condomínio fechado",
]


# -------------------------
# Utilidades gerais
# -------------------------
def normalize_text(s: Any) -> str:
    if s is None:
        return ""
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = " ".join(s.split())
    return s


def jitter(base: float, pct: float = 0.2) -> float:
    delta = base * pct
    return max(0.0, base + random.uniform(-delta, delta))


def safe_str(x: Any) -> str:
    return "" if x is None else str(x)


# -------------------------
# Google Places (New)
# -------------------------
@dataclass
class PlacesConfig:
    api_key: str
    language_code: str = "pt-BR"
    region_code: str = "BR"
    timeout_s: int = 20
    max_retries: int = 5
    backoff_base_s: float = 1.2
    sleep_between_calls_s: float = 0.2
    page_size: int = 20
    max_pages: int = 3
    # location bias opcional
    bias_lat: Optional[float] = None
    bias_lng: Optional[float] = None
    bias_radius_m: Optional[int] = None


class PlacesClient:
    def __init__(self, cfg: PlacesConfig) -> None:
        self.cfg = cfg
        self.session = requests.Session()

    def _headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.cfg.api_key,
            "X-Goog-FieldMask": (
                "places.id,"
                "places.displayName,"
                "places.formattedAddress,"
                "places.location,"
                "places.types"
            ),
        }

    def _build_payload(self, query: str, page_token: Optional[str] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "textQuery": query,
            "languageCode": self.cfg.language_code,
            "regionCode": self.cfg.region_code,
            "pageSize": self.cfg.page_size,
        }

        if (
            self.cfg.bias_lat is not None
            and self.cfg.bias_lng is not None
            and self.cfg.bias_radius_m is not None
        ):
            payload["locationBias"] = {
                "circle": {
                    "center": {"latitude": self.cfg.bias_lat, "longitude": self.cfg.bias_lng},
                    "radius": float(self.cfg.bias_radius_m),
                }
            }

        if page_token:
            payload["pageToken"] = page_token

        return payload

    def search_text(self, query: str) -> List[Dict[str, Any]]:
        all_results: List[Dict[str, Any]] = []
        page_token: Optional[str] = None

        for page_idx in range(1, self.cfg.max_pages + 1):
            payload = self._build_payload(query, page_token=page_token)
            logging.info("Places searchText (página %d/%d): %r", page_idx, self.cfg.max_pages, query)

            data = self._post_with_retry(payload)
            places = data.get("places") or []
            all_results.extend(self._adapt_places(places))

            page_token = data.get("nextPageToken") or data.get("next_page_token")
            if not page_token:
                break

            time.sleep(self.cfg.sleep_between_calls_s)

        return all_results

    def _post_with_retry(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        last_err: Optional[Exception] = None

        for attempt in range(1, self.cfg.max_retries + 1):
            try:
                resp = self.session.post(
                    PLACES_URL,
                    json=payload,
                    headers=self._headers(),
                    timeout=self.cfg.timeout_s,
                )

                if resp.status_code == 200:
                    return resp.json()

                if resp.status_code in (429, 500, 502, 503, 504):
                    msg = _extract_err_msg(resp)
                    wait_s = jitter(self.cfg.backoff_base_s * (2 ** (attempt - 1)))
                    logging.warning(
                        "Places HTTP %s (%s). Retry %d/%d em %.2fs",
                        resp.status_code,
                        msg,
                        attempt,
                        self.cfg.max_retries,
                        wait_s,
                    )
                    time.sleep(wait_s)
                    continue

                msg = _extract_err_msg(resp)
                raise RuntimeError(f"Erro Places HTTP {resp.status_code}: {msg}")

            except (requests.Timeout, requests.ConnectionError) as e:
                last_err = e
                wait_s = jitter(self.cfg.backoff_base_s * (2 ** (attempt - 1)))
                logging.warning(
                    "Places erro rede/timeout (%s). Retry %d/%d em %.2fs",
                    str(e),
                    attempt,
                    self.cfg.max_retries,
                    wait_s,
                )
                time.sleep(wait_s)

        raise RuntimeError(f"Places falhou após {self.cfg.max_retries} tentativas. Último erro: {last_err}")

    @staticmethod
    def _adapt_places(places: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for p in places:
            loc = p.get("location") or {}
            display = (p.get("displayName") or {}).get("text") or ""
            results.append(
                {
                    "place_id": p.get("id"),
                    "name": display,
                    "formatted_address": p.get("formattedAddress") or "",
                    "lat": loc.get("latitude"),
                    "lng": loc.get("longitude"),
                    "types": p.get("types") or [],
                }
            )
        return results


def _extract_err_msg(resp: requests.Response) -> str:
    try:
        data = resp.json()
        return data.get("error", {}).get("message") or str(data)
    except Exception:
        return resp.text[:300]


# -------------------------
# Enriquecimento via cnpj.biz (best-effort)
# -------------------------
@dataclass
class CnpjBizConfig:
    enabled: bool = False
    timeout_s: int = 20
    max_retries: int = 3
    backoff_base_s: float = 1.0
    sleep_between_calls_s: float = 0.4


class CnpjBizClient:
    """
    Best-effort: tenta achar uma página de CNPJ no cnpj.biz e extrair telefone/email do HTML.
    Como o site pode ter paywall (402), o cliente tolera isso e devolve vazios.
    """

    # telefones BR comuns (fixo/celular) com/sem DDD e com separadores
    PHONE_RE = re.compile(
        r"(\(?\b\d{2}\)?\s*)?(\b9?\d{4}\b)[\s\-]?(\d{4}\b)",
        re.IGNORECASE,
    )
    EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE)
    # páginas do tipo /12345678000190
    CNPJ_PATH_RE = re.compile(r"/(\d{14})(?:\b|/)", re.IGNORECASE)

    def __init__(self, cfg: CnpjBizConfig) -> None:
        self.cfg = cfg
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) SuphelpGeoIntelligence/1.0",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
            }
        )

    def enrich_one(self, nome: str, cidade: str) -> Dict[str, Any]:
        """
        Retorna dict com:
        - cnpj_biz_cnpj
        - cnpj_biz_url
        - cnpj_biz_telefones (string ; separados)
        - cnpj_biz_emails (string ; separados)
        - cnpj_biz_status (OK / NOT_FOUND / PAYWALL / ERROR)
        """
        if not self.cfg.enabled:
            return {
                "cnpj_biz_cnpj": "",
                "cnpj_biz_url": "",
                "cnpj_biz_telefones": "",
                "cnpj_biz_emails": "",
                "cnpj_biz_status": "DISABLED",
            }

        query = f"{nome} {cidade}".strip()
        search_urls = [
            # Tentativas mais prováveis (podem variar conforme o site)
            ("empresas_q", f"https://cnpj.biz/empresas?q={requests.utils.quote(query)}"),
            ("busca_q", f"https://cnpj.biz/busca?q={requests.utils.quote(query)}"),
            ("search_q", f"https://cnpj.biz/search?q={requests.utils.quote(query)}"),
            ("site_root_q", f"https://cnpj.biz/?q={requests.utils.quote(query)}"),
        ]

        # 1) tenta achar uma URL de CNPJ
        for label, url in search_urls:
            html, status = self._get_with_retry(url)
            if status == 402:
                return self._empty("PAYWALL")
            if status != 200 or not html:
                continue

            cnpj_url = self._find_first_cnpj_url(html)
            if cnpj_url:
                # 2) extrai contatos na página do CNPJ
                return self._extract_contacts_from_cnpj_page(cnpj_url)

        return self._empty("NOT_FOUND")

    def _extract_contacts_from_cnpj_page(self, cnpj_url: str) -> Dict[str, Any]:
        html, status = self._get_with_retry(cnpj_url)
        if status == 402:
            return self._empty("PAYWALL")
        if status != 200 or not html:
            return self._empty("ERROR")

        phones = sorted(set(self._extract_phones(html)))
        emails = sorted(set(self._extract_emails(html)))
        cnpj = self._extract_cnpj_from_url(cnpj_url)

        return {
            "cnpj_biz_cnpj": cnpj,
            "cnpj_biz_url": cnpj_url,
            "cnpj_biz_telefones": "; ".join(phones),
            "cnpj_biz_emails": "; ".join(emails),
            "cnpj_biz_status": "OK",
        }

    def _find_first_cnpj_url(self, html: str) -> Optional[str]:
        # tenta via soup (links)
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            m = self.CNPJ_PATH_RE.search(href)
            if m:
                cnpj = m.group(1)
                return f"https://cnpj.biz/{cnpj}"

        # fallback: regex no HTML bruto
        m2 = self.CNPJ_PATH_RE.search(html)
        if m2:
            cnpj = m2.group(1)
            return f"https://cnpj.biz/{cnpj}"
        return None

    def _extract_cnpj_from_url(self, url: str) -> str:
        m = re.search(r"/(\d{14})(?:\b|/)$", url)
        return m.group(1) if m else ""

    def _extract_emails(self, html: str) -> List[str]:
        # remove scripts para reduzir lixo
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(" ", strip=True)
        return self.EMAIL_RE.findall(text)

    def _extract_phones(self, html: str) -> List[str]:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(" ", strip=True)

        out = []
        for m in self.PHONE_RE.finditer(text):
            ddd = (m.group(1) or "").strip()
            part1 = m.group(2)
            part2 = m.group(3)
            phone = f"{ddd} {part1}-{part2}".strip()
            phone = re.sub(r"\s+", " ", phone)
            out.append(phone)
        return out

    def _get_with_retry(self, url: str) -> Tuple[str, int]:
        last_err: Optional[Exception] = None

        for attempt in range(1, self.cfg.max_retries + 1):
            try:
                resp = self.session.get(url, timeout=self.cfg.timeout_s)
                if resp.status_code == 200:
                    return resp.text, 200

                if resp.status_code == 402:
                    logging.warning("cnpj.biz paywall (402) em %s", url)
                    return "", 402

                if resp.status_code in (429, 500, 502, 503, 504):
                    wait_s = jitter(self.cfg.backoff_base_s * (2 ** (attempt - 1)))
                    logging.warning(
                        "cnpj.biz HTTP %s em %s. Retry %d/%d em %.2fs",
                        resp.status_code,
                        url,
                        attempt,
                        self.cfg.max_retries,
                        wait_s,
                    )
                    time.sleep(wait_s)
                    continue

                return "", resp.status_code

            except (requests.Timeout, requests.ConnectionError) as e:
                last_err = e
                wait_s = jitter(self.cfg.backoff_base_s * (2 ** (attempt - 1)))
                logging.warning(
                    "cnpj.biz rede/timeout (%s) em %s. Retry %d/%d em %.2fs",
                    str(e),
                    url,
                    attempt,
                    self.cfg.max_retries,
                    wait_s,
                )
                time.sleep(wait_s)

        logging.error("cnpj.biz falhou (último erro: %s) url=%s", last_err, url)
        return "", 0

    def _empty(self, status: str) -> Dict[str, Any]:
        return {
            "cnpj_biz_cnpj": "",
            "cnpj_biz_url": "",
            "cnpj_biz_telefones": "",
            "cnpj_biz_emails": "",
            "cnpj_biz_status": status,
        }


# -------------------------
# Pipeline principal
# -------------------------
def collect_places(
    client: PlacesClient,
    city_query: str,
    keywords: List[str],
    sleep_s: float,
) -> pd.DataFrame:
    by_place_id: Dict[str, Dict[str, Any]] = {}
    by_norm_key: Dict[str, str] = {}

    for kw in keywords:
        query = f"{kw} {city_query}"
        results = client.search_text(query)

        for r in results:
            place_id = r.get("place_id")
            nome = r.get("name") or ""
            endereco = r.get("formatted_address") or ""

            if place_id and place_id in by_place_id:
                continue

            norm_key = normalize_text(nome) + " | " + normalize_text(endereco)
            if norm_key in by_norm_key:
                continue

            row = {
                "place_id": place_id,
                "nome": nome,
                "endereco": endereco,
                "lat": r.get("lat"),
                "lng": r.get("lng"),
                "types": ",".join(r.get("types", [])),
            }

            if place_id:
                by_place_id[place_id] = row
                by_norm_key[norm_key] = place_id
            else:
                fallback_id = f"no_place_id::{norm_key}"
                by_place_id[fallback_id] = row
                by_norm_key[norm_key] = fallback_id

        time.sleep(sleep_s)

    df = pd.DataFrame(list(by_place_id.values()))
    if not df.empty:
        df = df.sort_values("nome").reset_index(drop=True)
    return df


def merge_populacao(df: pd.DataFrame, csv_pop: Path) -> pd.DataFrame:
    if not csv_pop.exists():
        logging.warning("CSV de população não encontrado: %s", csv_pop)
        df["populacao_estimada"] = pd.NA
        return df

    df_pop = pd.read_csv(csv_pop)

    for col in ("nome", "populacao_estimada"):
        if col not in df_pop.columns:
            raise ValueError(f"CSV de população precisa ter a coluna {col!r}.")

    base = df.copy()
    base["nome_norm"] = base["nome"].map(normalize_text)

    pop = df_pop.copy()
    pop["nome_norm"] = pop["nome"].map(normalize_text)

    merged = base.merge(
        pop[["nome", "populacao_estimada"]],
        on="nome",
        how="left",
        suffixes=("", "_pop"),
    )

    missing_mask = merged["populacao_estimada"].isna()
    if missing_mask.any():
        merged2 = merged[missing_mask].drop(columns=["populacao_estimada"]).merge(
            pop[["nome_norm", "populacao_estimada"]],
            on="nome_norm",
            how="left",
        )
        merged.loc[missing_mask, "populacao_estimada"] = merged2["populacao_estimada"].values

    merged = merged.drop(columns=["nome_norm"], errors="ignore")
    return merged


def enrich_with_cnpj_biz(df: pd.DataFrame, city_query: str, cnpj_client: CnpjBizClient) -> pd.DataFrame:
    """
    Para cada linha, tenta encontrar e extrair contato no cnpj.biz.
    """
    if df.empty:
        return df

    enriched_rows = []
    total = len(df)
    for i, row in df.iterrows():
        nome = safe_str(row.get("nome"))
        # usa a cidade_query (ex: "Jundiaí - SP, Brasil") para melhorar a busca
        data = cnpj_client.enrich_one(nome=nome, cidade=city_query)

        if (i + 1) % 20 == 0:
            logging.info("cnpj.biz enriquecimento: %d/%d", i + 1, total)

        enriched_rows.append(data)
        time.sleep(cnpj_client.cfg.sleep_between_calls_s)

    df2 = df.copy()
    add = pd.DataFrame(enriched_rows)
    df2 = pd.concat([df2.reset_index(drop=True), add.reset_index(drop=True)], axis=1)
    return df2


# -------------------------
# CLI / Main
# -------------------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Coleta condomínios via Google Places e gera CSV; opcionalmente enriquece com cnpj.biz.")
    p.add_argument("--city", default="Jundiaí - SP, Brasil", help="Cidade/consulta base.")
    p.add_argument("--keywords", nargs="*", default=DEFAULT_KEYWORDS, help="Lista de keywords.")
    p.add_argument("--output", default="condominios_jundiai_google_places.csv", help="CSV de saída base.")
    p.add_argument("--csv-pop", default="populacao_condominios_jundiai.csv", help="CSV opcional de população.")
    p.add_argument("--min-pop", type=int, default=750, help="Corte mínimo para arquivo 'maiores'.")
    p.add_argument("--page-size", type=int, default=20, help="pageSize Places.")
    p.add_argument("--max-pages", type=int, default=3, help="Máximo de páginas por keyword.")
    p.add_argument("--sleep", type=float, default=0.2, help="Sleep entre chamadas Places.")
    p.add_argument("--timeout", type=int, default=20, help="Timeout HTTP Places.")
    p.add_argument("--retries", type=int, default=5, help="Retries Places.")
    p.add_argument("--loglevel", default="INFO", help="DEBUG/INFO/WARNING/ERROR.")

    # locationBias Places
    p.add_argument("--bias-lat", type=float, default=None, help="Latitude do bias.")
    p.add_argument("--bias-lng", type=float, default=None, help="Longitude do bias.")
    p.add_argument("--bias-radius-m", type=int, default=None, help="Raio (m) do bias.")

    # cnpj.biz enrichment
    p.add_argument("--enrich-cnpj-biz", action="store_true", help="Enriquece com telefone/email via cnpj.biz (best-effort).")
    p.add_argument("--cnpj-timeout", type=int, default=20, help="Timeout HTTP cnpj.biz.")
    p.add_argument("--cnpj-retries", type=int, default=3, help="Retries cnpj.biz.")
    p.add_argument("--cnpj-sleep", type=float, default=0.4, help="Sleep entre chamadas cnpj.biz.")
    return p.parse_args()


def load_api_key(base_dir: Path) -> str:
    dotenv_path = base_dir / ".env"
    load_dotenv(dotenv_path=dotenv_path)

    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "API key não encontrada. Configure no .env:\n"
            "GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI\n"
            f"Arquivo esperado: {dotenv_path}"
        )
    return api_key


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=getattr(logging, args.loglevel.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    base_dir = Path(__file__).resolve().parent
    api_key = load_api_key(base_dir)

    places_cfg = PlacesConfig(
        api_key=api_key,
        timeout_s=args.timeout,
        max_retries=args.retries,
        sleep_between_calls_s=args.sleep,
        page_size=args.page_size,
        max_pages=args.max_pages,
        bias_lat=args.bias_lat,
        bias_lng=args.bias_lng,
        bias_radius_m=args.bias_radius_m,
    )

    places_client = PlacesClient(places_cfg)

    logging.info("Coleta Places: city=%r | keywords=%d", args.city, len(args.keywords))
    df = collect_places(places_client, args.city, list(args.keywords), sleep_s=args.sleep)

    if df.empty:
        logging.warning("Nenhum resultado coletado. Verifique API key, billing/limites e keywords.")
        return

    # Enriquecimento cnpj.biz
    cnpj_cfg = CnpjBizConfig(
        enabled=bool(args.enrich_cnpj_biz),
        timeout_s=args.cnpj_timeout,
        max_retries=args.cnpj_retries,
        sleep_between_calls_s=args.cnpj_sleep,
    )
    cnpj_client = CnpjBizClient(cnpj_cfg)

    if args.enrich_cnpj_biz:
        logging.info("Iniciando enriquecimento via cnpj.biz (best-effort)...")
        df = enrich_with_cnpj_biz(df, city_query=args.city, cnpj_client=cnpj_client)
        logging.info("Enriquecimento concluído.")

    # salva base (já com colunas cnpj.biz se habilitado)
    out_path = Path(args.output)
    df.to_csv(out_path, index=False, encoding="utf-8-sig")
    logging.info("Arquivo base gerado: %s (%d registros)", out_path, len(df))

    # merge população
    pop_path = Path(args.csv_pop)
    df_pop = merge_populacao(df, pop_path)

    out_pop = out_path.with_name(out_path.stem + "_com_populacao.csv")
    df_pop.to_csv(out_pop, index=False, encoding="utf-8-sig")
    logging.info("Arquivo com população gerado: %s", out_pop)

    # maiores
    if "populacao_estimada" in df_pop.columns:
        df_big = df_pop[df_pop["populacao_estimada"].fillna(-1) >= args.min_pop].copy()
        out_big = out_path.with_name(out_path.stem + f"_maiores_{args.min_pop}.csv")
        df_big.to_csv(out_big, index=False, encoding="utf-8-sig")
        logging.info("Arquivo maiores gerado: %s (%d registros)", out_big, len(df_big))

    logging.info("Prévia:\n%s", df.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
