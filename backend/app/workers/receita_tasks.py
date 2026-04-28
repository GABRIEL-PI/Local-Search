"""Tasks Celery para sincronização do dump CNPJ da Receita Federal.

Fluxo: sync_receita_dump(ano_mes) descobre os zips do mês e enfileira
download_receita_zip → ingest_receita_zip por arquivo. Tudo idempotente.

Roda no worker dedicado `localreach_celery_receita` (concurrency=1) pra não
brigar com scraping/outreach por disco e DB.
"""
import csv
import logging
import os
import time
import zipfile
from datetime import datetime, date, timezone
from typing import Iterable, Optional

from celery import shared_task, chain
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.workers.celery_app import celery_app
from app.services import receita_dav

logger = logging.getLogger(__name__)

DATA_DIR = os.environ.get("RECEITA_DATA_DIR", "/data/receita")
ZIPS_DIR = os.path.join(DATA_DIR, "zips")
EXTRACT_DIR = os.path.join(DATA_DIR, "extracted")

# Estabelecimentos: filtra por situação cadastral 02 (ativa) na ingestão.
# Sem isso, ~60M linhas viram ~30M úteis e o resto consome disco à toa.
ONLY_ACTIVE_ESTABELECIMENTOS = True

CHUNK_ROWS = 5000


def _sync_db():
    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True,
                           pool_recycle=3600, future=True)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()


def _ensure_dirs():
    os.makedirs(ZIPS_DIR, exist_ok=True)
    os.makedirs(EXTRACT_DIR, exist_ok=True)


def _meta_upsert(db, ano_mes: str, arquivo: str, **fields):
    """UPSERT atômico em receita_meta por (ano_mes, arquivo)."""
    cols = list(fields.keys())
    placeholders = ", ".join(f":{c}" for c in cols)
    updates = ", ".join(f"{c}=VALUES({c})" for c in cols)
    sql = text(f"""
        INSERT INTO receita_meta (ano_mes, arquivo, {", ".join(cols)})
        VALUES (:ano_mes, :arquivo, {placeholders})
        ON DUPLICATE KEY UPDATE {updates}
    """)
    db.execute(sql, {"ano_mes": ano_mes, "arquivo": arquivo, **fields})
    db.commit()


def _meta_status(db, ano_mes: str, arquivo: str) -> Optional[str]:
    row = db.execute(
        text("SELECT status FROM receita_meta WHERE ano_mes=:m AND arquivo=:a"),
        {"m": ano_mes, "a": arquivo},
    ).first()
    return row[0] if row else None


# ---------------------------------------------------------------------------
# Orquestrador
# ---------------------------------------------------------------------------

@celery_app.task(bind=True, name="app.workers.receita_tasks.sync_receita_dump",
                 queue="receita")
def sync_receita_dump(self, ano_mes: Optional[str] = None,
                       only: Optional[list[str]] = None) -> dict:
    """Descobre o dump do mês e enfileira download+ingest de cada zip.

    only: lista opcional de prefixos pra filtrar (ex: ['Empresas', 'Estabelecimentos']).
    """
    _ensure_dirs()
    if not ano_mes:
        ano_mes = receita_dav.latest_month()

    files = receita_dav.list_files(ano_mes)
    if only:
        files = [f for f in files if any(f["name"].startswith(p) for p in only)]

    db = _sync_db()
    enqueued = []
    try:
        for f in files:
            existing_status = _meta_status(db, ano_mes, f["name"])
            if existing_status == "concluido":
                logger.info(f"[receita] {f['name']} ja concluido, skip")
                continue
            _meta_upsert(db, ano_mes, f["name"], status="pendente",
                         bytes_total=f["size"])
            chain(
                download_receita_zip.s(ano_mes, f["name"], f["url"], f["size"]),
                ingest_receita_zip.s(ano_mes, f["name"]),
            ).apply_async()
            enqueued.append(f["name"])
    finally:
        db.close()

    return {"ano_mes": ano_mes, "enqueued": enqueued, "total": len(enqueued)}


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

@celery_app.task(bind=True, name="app.workers.receita_tasks.download_receita_zip",
                 queue="receita", max_retries=3)
def download_receita_zip(self, ano_mes: str, nome: str, url: str,
                         expected_size: Optional[int]) -> dict:
    _ensure_dirs()
    db = _sync_db()
    dest = os.path.join(ZIPS_DIR, f"{ano_mes}__{nome}")
    try:
        _meta_upsert(db, ano_mes, nome, status="baixando",
                     iniciado_em=datetime.now(timezone.utc))
        size = receita_dav.download_file(url, dest, expected_size)
        _meta_upsert(db, ano_mes, nome, bytes_baixados=size)
        return {"ano_mes": ano_mes, "nome": nome, "path": dest, "size": size}
    except Exception as exc:
        logger.exception(f"[receita] falha download {nome}")
        _meta_upsert(db, ano_mes, nome, status="erro", erro=str(exc)[:1000])
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Ingestão
# ---------------------------------------------------------------------------

# Mapa nome-prefixo → função handler.
# Cada handler recebe (db, csv_path, ano_mes, nome_arquivo) e devolve linhas inseridas.

def _parse_date(s: str) -> Optional[date]:
    """CSV usa AAAAMMDD. '0' ou vazio = NULL."""
    if not s or s == "0" or s == "00000000":
        return None
    try:
        return datetime.strptime(s, "%Y%m%d").date()
    except ValueError:
        return None


def _parse_decimal(s: str) -> Optional[float]:
    if not s:
        return None
    return float(s.replace(",", "."))


def _parse_int(s: str) -> Optional[int]:
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def _ingest_chunked(db, sql: str, rows: Iterable[dict]) -> int:
    """Faz INSERT em chunks de CHUNK_ROWS. Retorna total inserido."""
    total = 0
    batch: list[dict] = []
    for row in rows:
        batch.append(row)
        if len(batch) >= CHUNK_ROWS:
            db.execute(text(sql), batch)
            db.commit()
            total += len(batch)
            batch = []
    if batch:
        db.execute(text(sql), batch)
        db.commit()
        total += len(batch)
    return total


def _csv_iter(csv_path: str) -> Iterable[list[str]]:
    """Itera CSV da Receita: latin-1, separador `;`, quoted com `"`."""
    with open(csv_path, "r", encoding="latin-1", newline="") as f:
        reader = csv.reader(f, delimiter=";", quotechar='"')
        for row in reader:
            yield row


def _handler_empresas(db, csv_path: str, _ano_mes, _nome) -> int:
    sql = """
    INSERT INTO receita_empresa
      (cnpj_basico, razao_social, natureza_juridica, qualificacao_responsavel,
       capital_social, porte)
    VALUES (:cnpj_basico, :razao_social, :natureza_juridica, :qualificacao_responsavel,
            :capital_social, :porte)
    ON DUPLICATE KEY UPDATE
      razao_social=VALUES(razao_social),
      natureza_juridica=VALUES(natureza_juridica),
      qualificacao_responsavel=VALUES(qualificacao_responsavel),
      capital_social=VALUES(capital_social),
      porte=VALUES(porte)
    """

    def gen():
        for row in _csv_iter(csv_path):
            if len(row) < 7:
                continue
            yield {
                "cnpj_basico": row[0],
                "razao_social": (row[1] or None),
                "natureza_juridica": _parse_int(row[2]),
                "qualificacao_responsavel": _parse_int(row[3]),
                "capital_social": _parse_decimal(row[4]),
                "porte": (row[5] or None),
            }
    return _ingest_chunked(db, sql, gen())


def _handler_estabelecimentos(db, csv_path: str, _ano_mes, _nome) -> int:
    sql = """
    INSERT INTO receita_estabelecimento
      (cnpj_basico, cnpj_ordem, cnpj_dv, matriz_filial, nome_fantasia,
       situacao_cadastral, data_situacao_cadastral, data_inicio_atividade,
       cnae_principal, cnae_secundaria, tipo_logradouro, logradouro, numero,
       complemento, bairro, cep, uf, municipio, ddd_1, telefone_1,
       ddd_2, telefone_2, correio_eletronico)
    VALUES
      (:cnpj_basico, :cnpj_ordem, :cnpj_dv, :matriz_filial, :nome_fantasia,
       :situacao_cadastral, :data_situacao_cadastral, :data_inicio_atividade,
       :cnae_principal, :cnae_secundaria, :tipo_logradouro, :logradouro, :numero,
       :complemento, :bairro, :cep, :uf, :municipio, :ddd_1, :telefone_1,
       :ddd_2, :telefone_2, :correio_eletronico)
    ON DUPLICATE KEY UPDATE
      situacao_cadastral=VALUES(situacao_cadastral),
      data_situacao_cadastral=VALUES(data_situacao_cadastral),
      nome_fantasia=VALUES(nome_fantasia),
      ddd_1=VALUES(ddd_1), telefone_1=VALUES(telefone_1),
      correio_eletronico=VALUES(correio_eletronico),
      cnae_principal=VALUES(cnae_principal)
    """

    def gen():
        for row in _csv_iter(csv_path):
            if len(row) < 30:
                continue
            situacao = row[5] or None
            if ONLY_ACTIVE_ESTABELECIMENTOS and situacao != "02":
                continue
            yield {
                "cnpj_basico": row[0],
                "cnpj_ordem": row[1],
                "cnpj_dv": row[2],
                "matriz_filial": (row[3] or None),
                "nome_fantasia": (row[4] or None)[:255] if row[4] else None,
                "situacao_cadastral": situacao,
                "data_situacao_cadastral": _parse_date(row[6]),
                "data_inicio_atividade": _parse_date(row[10]),
                "cnae_principal": _parse_int(row[11]),
                "cnae_secundaria": (row[12] or None),
                "tipo_logradouro": (row[13] or None)[:50] if row[13] else None,
                "logradouro": (row[14] or None)[:150] if row[14] else None,
                "numero": (row[15] or None)[:20] if row[15] else None,
                "complemento": (row[16] or None)[:150] if row[16] else None,
                "bairro": (row[17] or None)[:100] if row[17] else None,
                "cep": (row[18] or None),
                "uf": (row[19] or None),
                "municipio": _parse_int(row[20]),
                "ddd_1": (row[21] or None),
                "telefone_1": (row[22] or None),
                "ddd_2": (row[23] or None),
                "telefone_2": (row[24] or None),
                "correio_eletronico": (row[27] or None)[:150] if row[27] else None,
            }
    return _ingest_chunked(db, sql, gen())


def _handler_simples(db, csv_path: str, _ano_mes, _nome) -> int:
    sql = """
    INSERT INTO receita_simples
      (cnpj_basico, opcao_simples, data_opcao_simples, data_exclusao_simples,
       opcao_mei, data_opcao_mei, data_exclusao_mei)
    VALUES
      (:cnpj_basico, :opcao_simples, :data_opcao_simples, :data_exclusao_simples,
       :opcao_mei, :data_opcao_mei, :data_exclusao_mei)
    ON DUPLICATE KEY UPDATE
      opcao_simples=VALUES(opcao_simples),
      data_opcao_simples=VALUES(data_opcao_simples),
      data_exclusao_simples=VALUES(data_exclusao_simples),
      opcao_mei=VALUES(opcao_mei),
      data_opcao_mei=VALUES(data_opcao_mei),
      data_exclusao_mei=VALUES(data_exclusao_mei)
    """

    def gen():
        for row in _csv_iter(csv_path):
            if len(row) < 7:
                continue
            yield {
                "cnpj_basico": row[0],
                "opcao_simples": (row[1] or None),
                "data_opcao_simples": _parse_date(row[2]),
                "data_exclusao_simples": _parse_date(row[3]),
                "opcao_mei": (row[4] or None),
                "data_opcao_mei": _parse_date(row[5]),
                "data_exclusao_mei": _parse_date(row[6]),
            }
    return _ingest_chunked(db, sql, gen())


def _handler_lookup(table: str):
    """Genera handler para tabelas auxiliares de 2 colunas (codigo, descricao)."""
    sql = f"""
    INSERT INTO {table} (codigo, descricao) VALUES (:codigo, :descricao)
    ON DUPLICATE KEY UPDATE descricao=VALUES(descricao)
    """

    def handler(db, csv_path: str, _ano_mes, _nome) -> int:
        def gen():
            for row in _csv_iter(csv_path):
                if len(row) < 2:
                    continue
                codigo = _parse_int(row[0])
                if codigo is None:
                    continue
                yield {"codigo": codigo, "descricao": (row[1] or None)}
        return _ingest_chunked(db, sql, gen())
    return handler


HANDLERS: dict[str, callable] = {
    "Empresas": _handler_empresas,
    "Estabelecimentos": _handler_estabelecimentos,
    "Simples": _handler_simples,
    "Cnaes": _handler_lookup("receita_cnae"),
    "Municipios": _handler_lookup("receita_municipio"),
    "Naturezas": _handler_lookup("receita_natureza"),
    "Qualificacoes": _handler_lookup("receita_qualificacao"),
    # Skipped na v1: Socios, Paises, Motivos
}


def _resolve_handler(nome: str):
    for prefix, fn in HANDLERS.items():
        if nome.startswith(prefix):
            return fn
    return None


@celery_app.task(bind=True, name="app.workers.receita_tasks.ingest_receita_zip",
                 queue="receita_ingest", max_retries=2, time_limit=18000)
def ingest_receita_zip(self, prev: dict, ano_mes: str, nome: str) -> dict:
    """Recebe o dict do download_receita_zip via chain (prev) e ingere o CSV."""
    _ensure_dirs()
    handler = _resolve_handler(nome)
    if handler is None:
        return {"ano_mes": ano_mes, "nome": nome, "skipped": True,
                "reason": "no handler"}

    zip_path = prev["path"] if isinstance(prev, dict) else os.path.join(
        ZIPS_DIR, f"{ano_mes}__{nome}")

    db = _sync_db()
    try:
        _meta_upsert(db, ano_mes, nome, status="ingerindo")
        t0 = time.time()

        # Extrai num diretório próprio do arquivo pra evitar colisão de nomes
        out_dir = os.path.join(EXTRACT_DIR, f"{ano_mes}__{nome.replace('.zip','')}")
        os.makedirs(out_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path) as zf:
            members = zf.namelist()
            zf.extractall(out_dir)

        total_inserted = 0
        for member in members:
            csv_path = os.path.join(out_dir, member)
            if not os.path.isfile(csv_path):
                continue
            inserted = handler(db, csv_path, ano_mes, nome)
            total_inserted += inserted
            try:
                os.remove(csv_path)  # libera disco assim que ingere
            except OSError:
                pass

        try:
            os.rmdir(out_dir)
        except OSError:
            pass

        elapsed = int(time.time() - t0)
        _meta_upsert(db, ano_mes, nome, status="concluido",
                     linhas_inseridas=total_inserted,
                     finalizado_em=datetime.now(timezone.utc))
        logger.info(f"[receita] {nome} ingerido: {total_inserted} linhas em {elapsed}s")
        return {"ano_mes": ano_mes, "nome": nome, "inserted": total_inserted,
                "elapsed_seconds": elapsed}
    except Exception as exc:
        logger.exception(f"[receita] falha ingest {nome}")
        _meta_upsert(db, ano_mes, nome, status="erro", erro=str(exc)[:1000])
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
