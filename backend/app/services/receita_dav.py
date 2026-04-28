"""WebDAV client pra dump de CNPJ da Receita Federal.

A Receita migrou pra Nextcloud em fev/2026. Listagem dos arquivos é via PROPFIND
em https://arquivos.receitafederal.gov.br/public.php/webdav/ usando um share_token
como user e senha vazia. Download direto via /public.php/dav/files/{token}/{ano-mes}/{file}.

Se o share_token rotacionar, navegar até https://arquivos.receitafederal.gov.br/
e copiar o token que aparece em /index.php/s/{TOKEN}.
"""
import logging
import os
import re
from typing import Iterable
from xml.etree import ElementTree

import httpx

logger = logging.getLogger(__name__)

DAV_NS = {"d": "DAV:"}
SHARE_TOKEN = os.environ.get("RECEITA_SHARE_TOKEN", "YggdBLfdninEJX9")
WEBDAV_URL = "https://arquivos.receitafederal.gov.br/public.php/webdav"
DOWNLOAD_BASE = "https://arquivos.receitafederal.gov.br/public.php/dav/files"


class ReceitaDavError(Exception):
    pass


def _propfind(url: str, depth: str = "1") -> ElementTree.Element:
    with httpx.Client(timeout=30, auth=(SHARE_TOKEN, "")) as client:
        resp = client.request("PROPFIND", url, headers={"Depth": depth})
        resp.raise_for_status()
        return ElementTree.fromstring(resp.content)


def list_months() -> list[str]:
    root = _propfind(WEBDAV_URL + "/")
    months = []
    for response in root.findall("d:response", DAV_NS):
        href = response.find("d:href", DAV_NS).text or ""
        m = re.search(r"(\d{4}-\d{2})/?$", href)
        if m:
            months.append(m.group(1))
    return sorted(set(months))


def list_files(ano_mes: str) -> list[dict]:
    """Lista arquivos do mês com tamanho. Retorna [{name, size, url}]."""
    root = _propfind(f"{WEBDAV_URL}/{ano_mes}/")
    files = []
    for response in root.findall("d:response", DAV_NS):
        href = (response.find("d:href", DAV_NS).text or "")
        m = re.search(r"/([^/]+\.zip)$", href, re.IGNORECASE)
        if not m:
            continue
        name = m.group(1)
        prop = response.find("d:propstat/d:prop", DAV_NS)
        size_el = prop.find("d:getcontentlength", DAV_NS) if prop is not None else None
        size = int(size_el.text) if (size_el is not None and size_el.text) else None
        files.append({
            "name": name,
            "size": size,
            "url": f"{DOWNLOAD_BASE}/{SHARE_TOKEN}/{ano_mes}/{name}",
        })
    return sorted(files, key=lambda f: f["name"])


def latest_month() -> str:
    months = list_months()
    if not months:
        raise ReceitaDavError("Nenhum mês listado no WebDAV da Receita")
    return months[-1]


def download_file(url: str, dest_path: str, expected_size: int | None = None,
                  chunk_size: int = 1024 * 1024) -> int:
    """Baixa o arquivo, idempotente: se dest_path já existe com mesmo tamanho, skip.

    Retorna o número de bytes finais no disco.
    """
    if expected_size is not None and os.path.exists(dest_path):
        actual = os.path.getsize(dest_path)
        if actual == expected_size:
            logger.info(f"[receita] skip {os.path.basename(dest_path)} (already {actual}B)")
            return actual

    tmp_path = dest_path + ".part"
    bytes_written = 0
    with httpx.stream("GET", url, auth=(SHARE_TOKEN, ""), timeout=600,
                      follow_redirects=True) as resp:
        resp.raise_for_status()
        with open(tmp_path, "wb") as f:
            for chunk in resp.iter_bytes(chunk_size):
                f.write(chunk)
                bytes_written += len(chunk)

    os.replace(tmp_path, dest_path)
    logger.info(f"[receita] baixou {os.path.basename(dest_path)}: {bytes_written} bytes")
    return bytes_written


def all_files_for_month(ano_mes: str) -> Iterable[dict]:
    return list_files(ano_mes)
