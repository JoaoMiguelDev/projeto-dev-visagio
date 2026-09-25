"""Regras de negócio e acesso a dados do domínio de filmes.

Concentra:
- consultas assíncronas com eager loading;
- criação sob demanda de gêneros, produtoras e pessoas;
- manutenção do resumo de avaliações (`dim_reviews`) a cada review.
"""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies import models, schemas


# --------------------------------------------------------------------------- #
# Helpers de criação sob demanda
# --------------------------------------------------------------------------- #
async def get_or_create_genre(db: AsyncSession, nome: str) -> models.DimGenre:
    stmt = select(models.DimGenre).where(models.DimGenre.nome_genero == nome)
    genre = (await db.execute(stmt)).scalar_one_or_none()
    if genre is None:
        genre = models.DimGenre(nome_genero=nome)
        db.add(genre)
        await db.flush()
    return genre


async def get_or_create_company(db: AsyncSession, nome: str) -> models.DimCompany:
    stmt = select(models.DimCompany).where(models.DimCompany.nome_produtora == nome)
    company = (await db.execute(stmt)).scalar_one_or_none()
    if company is None:
        company = models.DimCompany(nome_produtora=nome)
        db.add(company)
        await db.flush()
    return company


async def get_or_create_person(
    db: AsyncSession, nome: str, tipo: str
) -> models.DimPerson:
    stmt = select(models.DimPerson).where(
        models.DimPerson.nome_pessoa == nome,
        models.DimPerson.tipo_pessoa == tipo,
    )
    person = (await db.execute(stmt)).scalar_one_or_none()
    if person is None:
        person = models.DimPerson(nome_pessoa=nome, tipo_pessoa=tipo)
        db.add(person)
        await db.flush()
    return person


# --------------------------------------------------------------------------- #
# Conversão ORM -> schema
# --------------------------------------------------------------------------- #
def _to_movie_out(movie: models.DimMovie) -> schemas.MovieOut:
    summary = movie.reviews_summary
    return schemas.MovieOut(
        sk_movie_id=movie.sk_movie_id,
        id_filme=movie.id_filme,
        titulo=movie.titulo,
        ano_lancamento=movie.ano_lancamento,
        url_poster=movie.url_poster,
        generos=[g.nome_genero for g in movie.genres],
        nota_media_usuarios=summary.nota_media_usuarios if summary else None,
        qtd_avaliacoes_usuarios=summary.qtd_avaliacoes_usuarios if summary else 0,
    )


def _to_movie_detail_out(movie: models.DimMovie) -> schemas.MovieDetailOut:
    summary = movie.reviews_summary
    return schemas.MovieDetailOut(
        sk_movie_id=movie.sk_movie_id,
        id_filme=movie.id_filme,
        titulo=movie.titulo,
        ano_lancamento=movie.ano_lancamento,
        url_poster=movie.url_poster,
        generos=[g.nome_genero for g in movie.genres],
        nota_media_usuarios=summary.nota_media_usuarios if summary else None,
        qtd_avaliacoes_usuarios=summary.qtd_avaliacoes_usuarios if summary else 0,
        data_lancamento=movie.data_lancamento,
        duracao_minutos=movie.duracao_minutos,
        status_filme=movie.status_filme,
        sinopse=movie.sinopse,
        url_backdrop=movie.url_backdrop,
        produtoras=[c.nome_produtora for c in movie.companies],
        pessoas=[schemas.PersonOut.model_validate(p) for p in movie.people],
        performance=(
            schemas.PerformanceOut.model_validate(movie.performance)
            if movie.performance
            else None
        ),
        reviews=[schemas.ReviewOut.model_validate(r) for r in movie.reviews],
    )


# --------------------------------------------------------------------------- #
# Opções de eager loading
# --------------------------------------------------------------------------- #
def _list_options():
    return (
        selectinload(models.DimMovie.genres),
        selectinload(models.DimMovie.reviews_summary),
    )


def _detail_options():
    return (
        selectinload(models.DimMovie.genres),
        selectinload(models.DimMovie.companies),
        selectinload(models.DimMovie.people),
        selectinload(models.DimMovie.performance),
        selectinload(models.DimMovie.reviews),
        selectinload(models.DimMovie.reviews_summary),
    )


# --------------------------------------------------------------------------- #
# Leitura
# --------------------------------------------------------------------------- #
async def list_movies(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    genre: str | None = None,
) -> tuple[list[schemas.MovieOut], int]:
    base = select(models.DimMovie)

    if search:
        director_match = models.DimMovie.people.any(
            (models.DimPerson.tipo_pessoa == "Diretor")
            & (models.DimPerson.nome_pessoa.ilike(f"%{search}%"))
        )
        base = base.where(
            or_(
                models.DimMovie.titulo.ilike(f"%{search}%"),
                director_match,
            )
        )
    if genre:
        base = base.where(
            models.DimMovie.genres.any(models.DimGenre.nome_genero == genre)
        )

    total = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()

    stmt = (
        base.options(*_list_options())
        .order_by(
            models.DimMovie.ano_lancamento.desc().nullslast(),
            models.DimMovie.titulo.asc(),
        )
        .offset(skip)
        .limit(limit)
    )
    movies = (await db.execute(stmt)).scalars().unique().all()

    return [_to_movie_out(m) for m in movies], total


async def get_movie(
    db: AsyncSession, sk_movie_id: str
) -> schemas.MovieDetailOut | None:
    stmt = (
        select(models.DimMovie)
        .where(models.DimMovie.sk_movie_id == sk_movie_id)
        .options(*_detail_options())
    )
    movie = (await db.execute(stmt)).scalar_one_or_none()
    return _to_movie_detail_out(movie) if movie else None


async def list_genres(db: AsyncSession) -> list[schemas.GenreOut]:
    stmt = select(models.DimGenre).order_by(models.DimGenre.nome_genero)
    genres = (await db.execute(stmt)).scalars().all()
    return [schemas.GenreOut.model_validate(g) for g in genres]


# --------------------------------------------------------------------------- #
# Escrita — filme
# --------------------------------------------------------------------------- #
async def create_movie(
    db: AsyncSession, payload: schemas.MovieCreate
) -> schemas.MovieDetailOut:
    movie = models.DimMovie(
        id_filme=payload.id_filme,
        titulo=payload.titulo,
        data_lancamento=payload.data_lancamento,
        ano_lancamento=payload.ano_lancamento,
        duracao_minutos=payload.duracao_minutos,
        status_filme=payload.status_filme,
        sinopse=payload.sinopse,
        url_poster=payload.url_poster,
        url_backdrop=payload.url_backdrop,
    )

    for nome in payload.generos:
        movie.genres.append(await get_or_create_genre(db, nome))
    for nome in payload.produtoras:
        movie.companies.append(await get_or_create_company(db, nome))
    for p in payload.pessoas:
        movie.people.append(await get_or_create_person(db, p.nome_pessoa, p.tipo_pessoa))

    if payload.performance is not None:
        movie.performance = models.FactMoviePerformance(
            **payload.performance.model_dump()
        )

    db.add(movie)
    await db.flush()

    # Todo filme nasce com resumo de avaliações zerado.
    movie.reviews_summary = models.DimReview(
        sk_movie_id=movie.sk_movie_id,
        qtd_avaliacoes_usuarios=0,
        nota_media_usuarios=None,
    )

    await db.commit()

    created = await get_movie(db, movie.sk_movie_id)
    assert created is not None  # acabou de ser criado
    return created


async def update_movie(
    db: AsyncSession, sk_movie_id: str, payload: schemas.MovieUpdate
) -> schemas.MovieDetailOut | None:
    stmt = (
        select(models.DimMovie)
        .where(models.DimMovie.sk_movie_id == sk_movie_id)
        .options(*_detail_options())
    )
    movie = (await db.execute(stmt)).scalar_one_or_none()
    if movie is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    scalar_fields = {
        "titulo", "data_lancamento", "ano_lancamento", "duracao_minutos",
        "status_filme", "sinopse", "url_poster", "url_backdrop",
    }
    for field in scalar_fields:
        if field in data:
            setattr(movie, field, data[field])

    if payload.generos is not None:
        movie.genres = [await get_or_create_genre(db, n) for n in payload.generos]
    if payload.produtoras is not None:
        movie.companies = [
            await get_or_create_company(db, n) for n in payload.produtoras
        ]
    if payload.pessoas is not None:
        movie.people = [
            await get_or_create_person(db, p.nome_pessoa, p.tipo_pessoa)
            for p in payload.pessoas
        ]

    if payload.performance is not None:
        perf_data = payload.performance.model_dump()
        if movie.performance is None:
            movie.performance = models.FactMoviePerformance(**perf_data)
        else:
            for field, value in perf_data.items():
                setattr(movie.performance, field, value)

    await db.commit()
    return await get_movie(db, sk_movie_id)


async def delete_movie(db: AsyncSession, sk_movie_id: str) -> bool:
    stmt = select(models.DimMovie).where(models.DimMovie.sk_movie_id == sk_movie_id)
    movie = (await db.execute(stmt)).scalar_one_or_none()
    if movie is None:
        return False
    await db.delete(movie)
    await db.commit()
    return True


# --------------------------------------------------------------------------- #
# Escrita — avaliação
# --------------------------------------------------------------------------- #
async def _recompute_review_summary(db: AsyncSession, sk_movie_id: str) -> None:
    stmt = select(
        func.count(models.MovieReview.sk_movie_review_id),
        func.avg(models.MovieReview.nota),
    ).where(models.MovieReview.sk_movie_id == sk_movie_id)
    count, avg = (await db.execute(stmt)).one()

    summary = (
        await db.execute(
            select(models.DimReview).where(models.DimReview.sk_movie_id == sk_movie_id)
        )
    ).scalar_one_or_none()

    if summary is None:
        summary = models.DimReview(sk_movie_id=sk_movie_id)
        db.add(summary)

    summary.qtd_avaliacoes_usuarios = count or 0
    summary.nota_media_usuarios = round(float(avg), 2) if avg is not None else None


async def add_review(
    db: AsyncSession, sk_movie_id: str, payload: schemas.ReviewCreate
) -> schemas.ReviewOut | None:
    exists = (
        await db.execute(
            select(models.DimMovie.sk_movie_id).where(
                models.DimMovie.sk_movie_id == sk_movie_id
            )
        )
    ).scalar_one_or_none()
    if exists is None:
        return None

    review = models.MovieReview(
        sk_movie_id=sk_movie_id,
        nome=payload.nome,
        nota=payload.nota,
        comentario=payload.comentario,
    )
    db.add(review)
    await db.flush()
    await _recompute_review_summary(db, sk_movie_id)
    await db.commit()
    await db.refresh(review)
    return schemas.ReviewOut.model_validate(review)


async def list_reviews(
    db: AsyncSession, sk_movie_id: str
) -> list[schemas.ReviewOut] | None:
    exists = (
        await db.execute(
            select(models.DimMovie.sk_movie_id).where(
                models.DimMovie.sk_movie_id == sk_movie_id
            )
        )
    ).scalar_one_or_none()
    if exists is None:
        return None

    stmt = (
        select(models.MovieReview)
        .where(models.MovieReview.sk_movie_id == sk_movie_id)
        .order_by(models.MovieReview.created_at.desc())
    )
    reviews = (await db.execute(stmt)).scalars().all()
    return [schemas.ReviewOut.model_validate(r) for r in reviews]