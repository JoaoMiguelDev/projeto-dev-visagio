"""Endpoints HTTP do domínio de filmes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import schemas, service

movies_router = APIRouter(prefix="/movies", tags=["movies"])
genres_router = APIRouter(prefix="/genres", tags=["genres"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


# --------------------------------------------------------------------------- #
# Filmes
# --------------------------------------------------------------------------- #
@movies_router.get("/", response_model=schemas.PaginatedMovies)
async def list_movies(
    db: DbSession,
    skip: int = Query(0, ge=0, description="Quantidade de registros a pular"),
    limit: int = Query(20, ge=1, le=100, description="Tamanho da página"),
    search: str | None = Query(
        None, min_length=1, max_length=200, description="Busca por título ou diretor"
    ),
    genre: str | None = Query(
        None, min_length=1, max_length=50, description="Filtra por gênero exato"
    ),
) -> schemas.PaginatedMovies:
    items, total = await service.list_movies(
        db, skip=skip, limit=limit, search=search, genre=genre
    )
    return schemas.PaginatedMovies(total=total, skip=skip, limit=limit, items=items)


@movies_router.post(
    "/",
    response_model=schemas.MovieDetailOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_movie(
    payload: schemas.MovieCreate, db: DbSession
) -> schemas.MovieDetailOut:
    return await service.create_movie(db, payload)


@movies_router.get("/{sk_movie_id}", response_model=schemas.MovieDetailOut)
async def get_movie(sk_movie_id: str, db: DbSession) -> schemas.MovieDetailOut:
    movie = await service.get_movie(db, sk_movie_id)
    if movie is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado")
    return movie


@movies_router.put("/{sk_movie_id}", response_model=schemas.MovieDetailOut)
async def update_movie(
    sk_movie_id: str, payload: schemas.MovieUpdate, db: DbSession
) -> schemas.MovieDetailOut:
    movie = await service.update_movie(db, sk_movie_id, payload)
    if movie is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado")
    return movie


@movies_router.delete("/{sk_movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(sk_movie_id: str, db: DbSession) -> None:
    deleted = await service.delete_movie(db, sk_movie_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado")


# --------------------------------------------------------------------------- #
# Avaliações
# --------------------------------------------------------------------------- #
@movies_router.get("/{sk_movie_id}/reviews", response_model=list[schemas.ReviewOut])
async def list_reviews(sk_movie_id: str, db: DbSession) -> list[schemas.ReviewOut]:
    reviews = await service.list_reviews(db, sk_movie_id)
    if reviews is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado")
    return reviews


@movies_router.post(
    "/{sk_movie_id}/reviews",
    response_model=schemas.ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_review(
    sk_movie_id: str, payload: schemas.ReviewCreate, db: DbSession
) -> schemas.ReviewOut:
    review = await service.add_review(db, sk_movie_id, payload)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filme não encontrado")
    return review


# --------------------------------------------------------------------------- #
# Gêneros
# --------------------------------------------------------------------------- #
@genres_router.get("/", response_model=list[schemas.GenreOut])
async def list_genres(db: DbSession) -> list[schemas.GenreOut]:
    return await service.list_genres(db)