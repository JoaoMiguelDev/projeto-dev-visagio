"""Carga dos CSVs de seed em `backend/data/`.

Uso (a partir de `backend/`):

    python -m scripts.seed

Idempotente: usa `INSERT ... ON CONFLICT DO NOTHING` do SQLite para
evitar duplicatas. Respeita a ordem das foreign keys e ignora linhas
cujas FKs apontem para registros ausentes nas dimensões.
"""

import asyncio
import csv
from datetime import date
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.movies import models

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CSV_ENCODING = "utf-8"


# --------------------------------------------------------------------------- #
# Leitura e conversão
# --------------------------------------------------------------------------- #
def _read_csv(filename: str) -> list[dict[str, str]]:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"CSV não encontrado: {path}")
    with path.open("r", encoding=CSV_ENCODING, newline="") as f:
        return list(csv.DictReader(f))


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _to_int(value: str | None) -> int | None:
    v = _clean(value)
    return int(float(v)) if v is not None else None


def _to_float(value: str | None) -> float | None:
    v = _clean(value)
    return float(v) if v is not None else None


def _to_decimal(value: str | None) -> Decimal | None:
    v = _clean(value)
    return Decimal(v) if v is not None else None


def _to_date(value: str | None) -> date | None:
    v = _clean(value)
    return date.fromisoformat(v) if v is not None else None


# --------------------------------------------------------------------------- #
# Inserção em lote (idempotente)
# --------------------------------------------------------------------------- #
async def _insert_or_ignore(db: AsyncSession, table, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = sqlite_insert(table).on_conflict_do_nothing()
    await db.execute(stmt, rows)


async def _load_valid_ids(db: AsyncSession) -> dict[str, set[str]]:
    """Carrega os IDs existentes após a inserção das dimensões."""

    async def _ids(column):
        result = await db.execute(select(column))
        return {row[0] for row in result.all()}

    return {
        "movies": await _ids(models.DimMovie.sk_movie_id),
        "genres": await _ids(models.DimGenre.sk_genre_id),
        "companies": await _ids(models.DimCompany.sk_company_id),
        "people": await _ids(models.DimPerson.sk_person_id),
    }


# --------------------------------------------------------------------------- #
# Carga por arquivo
# --------------------------------------------------------------------------- #
async def seed_genres(db: AsyncSession) -> None:
    rows = [
        {"sk_genre_id": r["sk_genre_id"], "nome_genero": r["nome_genero"]}
        for r in _read_csv("dim_genres.csv")
    ]
    await _insert_or_ignore(db, models.DimGenre.__table__, rows)


async def seed_companies(db: AsyncSession) -> None:
    rows = [
        {"sk_company_id": r["sk_company_id"], "nome_produtora": r["nome_produtora"]}
        for r in _read_csv("dim_companies.csv")
    ]
    await _insert_or_ignore(db, models.DimCompany.__table__, rows)


async def seed_people(db: AsyncSession) -> None:
    rows = [
        {
            "sk_person_id": r["sk_person_id"],
            "nome_pessoa": r["nome_pessoa"],
            "tipo_pessoa": r["tipo_pessoa"],
        }
        for r in _read_csv("dim_people.csv")
    ]
    await _insert_or_ignore(db, models.DimPerson.__table__, rows)


async def seed_movies(db: AsyncSession) -> None:
    rows = [
        {
            "sk_movie_id": r["sk_movie_id"],
            "id_filme": r["id_filme"],
            "titulo": r["titulo"],
            "data_lancamento": _to_date(r["data_lancamento"]),
            "ano_lancamento": _to_int(r["ano_lancamento"]),
            "duracao_minutos": _to_int(r["duracao_minutos"]),
            "status_filme": _clean(r["status_filme"]),
            "sinopse": _clean(r["sinopse"]),
            "url_poster": _clean(r["url_poster"]),
            "url_backdrop": _clean(r["url_backdrop"]),
        }
        for r in _read_csv("dim_movies.csv")
    ]
    await _insert_or_ignore(db, models.DimMovie.__table__, rows)


def _filter_bridge(
    rows: list[dict[str, str]], fk_left: str, fk_right: str, valid: dict
) -> list[dict[str, str]]:
    """Descarta linhas cujas FKs não existem nas dimensões."""
    left_ids = valid["movies"]
    right_ids = valid["genres"] if fk_right == "sk_genre_id" else (
        valid["companies"] if fk_right == "sk_company_id" else valid["people"]
    )
    return [r for r in rows if r[fk_left] in left_ids and r[fk_right] in right_ids]


async def seed_bridges(db: AsyncSession, valid: dict[str, set[str]]) -> None:
    raw = _read_csv("bridge_movie_genre.csv")
    filtered = _filter_bridge(raw, "sk_movie_id", "sk_genre_id", valid)
    print(f"   - bridge_movie_genre: {len(filtered)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(
        db,
        models.bridge_movie_genre,
        [
            {"sk_movie_id": r["sk_movie_id"], "sk_genre_id": r["sk_genre_id"]}
            for r in filtered
        ],
    )

    raw = _read_csv("bridge_movie_company.csv")
    filtered = _filter_bridge(raw, "sk_movie_id", "sk_company_id", valid)
    print(f"   - bridge_movie_company: {len(filtered)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(
        db,
        models.bridge_movie_company,
        [
            {"sk_movie_id": r["sk_movie_id"], "sk_company_id": r["sk_company_id"]}
            for r in filtered
        ],
    )

    raw = _read_csv("bridge_movie_person.csv")
    filtered = _filter_bridge(raw, "sk_movie_id", "sk_person_id", valid)
    print(f"   - bridge_movie_person: {len(filtered)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(
        db,
        models.bridge_movie_person,
        [
            {"sk_movie_id": r["sk_movie_id"], "sk_person_id": r["sk_person_id"]}
            for r in filtered
        ],
    )


async def seed_performance(db: AsyncSession, valid: dict[str, set[str]]) -> None:
    raw = _read_csv("fact_movies_performance.csv")
    rows = [
        {
            "sk_movie_id": r["sk_movie_id"],
            "orcamento_usd": _to_decimal(r["orcamento_usd"]),
            "receita_usd": _to_decimal(r["receita_usd"]),
            "lucro_usd": _to_decimal(r["lucro_usd"]) or Decimal("0"),
            "orcamento_brl": _to_decimal(r["orcamento_brl"]),
            "receita_brl": _to_decimal(r["receita_brl"]),
            "lucro_brl": _to_decimal(r["lucro_brl"]) or Decimal("0"),
            "popularidade": _to_float(r["popularidade"]),
            "nota_tmdb": _to_float(r["nota_tmdb"]),
            "qtd_tmdb": _to_int(r["qtd_tmdb"]),
            "nota_imdb": _to_float(r["nota_imdb"]),
            "qtd_imdb": _to_int(r["qtd_imdb"]),
        }
        for r in raw
        if r["sk_movie_id"] in valid["movies"]
    ]
    print(f"   - fact_movies_performance: {len(rows)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(db, models.FactMoviePerformance.__table__, rows)


async def seed_movie_reviews(db: AsyncSession, valid: dict[str, set[str]]) -> None:
    raw = _read_csv("movies_reviews.csv")
    rows = [
        {
            "sk_movie_review_id": r["sk_movie_review_id"],
            "sk_movie_id": r["sk_movie_id"],
            "nome": r["nome"],
            "nota": _to_float(r["nota"]),
            "comentario": r["comentario"],
        }
        for r in raw
        if r["sk_movie_id"] in valid["movies"]
    ]
    print(f"   - movie_reviews: {len(rows)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(db, models.MovieReview.__table__, rows)


async def seed_dim_reviews(db: AsyncSession, valid: dict[str, set[str]]) -> None:
    raw = _read_csv("dim_reviews.csv")
    rows = [
        {
            "sk_review_id": r["sk_review_id"],
            "sk_movie_id": r["sk_movie_id"],
            "qtd_avaliacoes_usuarios": _to_int(r["qtd_avaliacoes_usuarios"]) or 0,
            "nota_media_usuarios": _to_float(r["nota_media_usuarios"]),
        }
        for r in raw
        if r["sk_movie_id"] in valid["movies"]
    ]
    print(f"   - dim_reviews: {len(rows)}/{len(raw)} linhas válidas")
    await _insert_or_ignore(db, models.DimReview.__table__, rows)


async def recalc_review_summaries(db: AsyncSession) -> None:
    """Recalcula `dim_reviews` a partir das avaliações individuais.

    Garante consistência caso o CSV de reviews contenha dados mais novos
    que o resumo pré-calculado.
    """
    stmt = select(
        models.MovieReview.sk_movie_id,
        func.count(models.MovieReview.sk_movie_review_id),
        func.avg(models.MovieReview.nota),
    ).group_by(models.MovieReview.sk_movie_id)
    results = (await db.execute(stmt)).all()

    for sk_movie_id, count, avg in results:
        nota_media = round(float(avg), 2) if avg is not None else None
        stmt_upsert = (
            sqlite_insert(models.DimReview)
            .values(
                sk_review_id=models.generate_surrogate_key(),
                sk_movie_id=sk_movie_id,
                qtd_avaliacoes_usuarios=count,
                nota_media_usuarios=nota_media,
            )
            .on_conflict_do_update(
                index_elements=["sk_movie_id"],
                set_={
                    "qtd_avaliacoes_usuarios": count,
                    "nota_media_usuarios": nota_media,
                },
            )
        )
        await db.execute(stmt_upsert)


# --------------------------------------------------------------------------- #
# Orquestração
# --------------------------------------------------------------------------- #
async def run() -> None:
    async with AsyncSessionLocal() as db:
        print("→ Gêneros...")
        await seed_genres(db)
        print("→ Produtoras...")
        await seed_companies(db)
        print("→ Pessoas...")
        await seed_people(db)
        print("→ Filmes...")
        await seed_movies(db)

        print("→ Carregando IDs válidos...")
        valid = await _load_valid_ids(db)

        print("→ Relações (bridges)...")
        await seed_bridges(db, valid)
        print("→ Performance...")
        await seed_performance(db, valid)
        print("→ Avaliações individuais...")
        await seed_movie_reviews(db, valid)
        print("→ Resumo de avaliações (CSV)...")
        await seed_dim_reviews(db, valid)
        print("→ Recalculando resumo de avaliações...")
        await recalc_review_summaries(db)
        await db.commit()
        print("\n✅ Seed concluído.")


if __name__ == "__main__":
    asyncio.run(run())