"""Schemas Pydantic do domínio de filmes.

Contrato de entrada e saída da API. Segue o modelo ORM definido em
`app.movies.models` — inclui avaliações na escala 0–10 e os campos
opcionais de performance financeira.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PersonType = Literal["Ator", "Diretor", "Roteirista"]


# --------------------------------------------------------------------------- #
# Pessoa
# --------------------------------------------------------------------------- #
class PersonInput(BaseModel):
    nome_pessoa: str = Field(..., max_length=255)
    tipo_pessoa: PersonType


class PersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_person_id: str
    nome_pessoa: str
    tipo_pessoa: PersonType


# --------------------------------------------------------------------------- #
# Gênero e produtora
# --------------------------------------------------------------------------- #
class GenreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_genre_id: str
    nome_genero: str


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_company_id: str
    nome_produtora: str


# --------------------------------------------------------------------------- #
# Performance
# --------------------------------------------------------------------------- #
class PerformanceInput(BaseModel):
    orcamento_usd: Decimal | None = None
    receita_usd: Decimal | None = None
    lucro_usd: Decimal = Decimal("0")
    orcamento_brl: Decimal | None = None
    receita_brl: Decimal | None = None
    lucro_brl: Decimal = Decimal("0")
    popularidade: float | None = None
    nota_tmdb: float | None = None
    qtd_tmdb: int | None = None
    nota_imdb: float | None = None
    qtd_imdb: int | None = None


class PerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_id: str
    orcamento_usd: Decimal | None = None
    receita_usd: Decimal | None = None
    lucro_usd: Decimal
    orcamento_brl: Decimal | None = None
    receita_brl: Decimal | None = None
    lucro_brl: Decimal
    popularidade: float | None = None
    nota_tmdb: float | None = None
    qtd_tmdb: int | None = None
    nota_imdb: float | None = None
    qtd_imdb: int | None = None


# --------------------------------------------------------------------------- #
# Avaliação
# --------------------------------------------------------------------------- #
class ReviewCreate(BaseModel):
    nome: str = Field(..., max_length=120)
    nota: float = Field(..., ge=0, le=10)
    comentario: str = Field(..., max_length=4000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_review_id: str
    sk_movie_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime


# --------------------------------------------------------------------------- #
# Filme — entrada
# --------------------------------------------------------------------------- #
class MovieBase(BaseModel):
    id_filme: str = Field(..., max_length=50)
    titulo: str = Field(..., max_length=500)
    data_lancamento: date | None = None
    ano_lancamento: int | None = None
    duracao_minutos: int | None = None
    status_filme: str | None = Field(None, max_length=50)
    sinopse: str | None = Field(None, max_length=4000)
    url_poster: str | None = Field(None, max_length=2048)
    url_backdrop: str | None = Field(None, max_length=2048)


class MovieCreate(MovieBase):
    generos: list[str] = Field(default_factory=list)
    produtoras: list[str] = Field(default_factory=list)
    pessoas: list[PersonInput] = Field(default_factory=list)
    performance: PerformanceInput | None = None


class MovieUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=500)
    data_lancamento: date | None = None
    ano_lancamento: int | None = None
    duracao_minutos: int | None = None
    status_filme: str | None = Field(None, max_length=50)
    sinopse: str | None = Field(None, max_length=4000)
    url_poster: str | None = Field(None, max_length=2048)
    url_backdrop: str | None = Field(None, max_length=2048)
    generos: list[str] | None = None
    produtoras: list[str] | None = None
    pessoas: list[PersonInput] | None = None
    performance: PerformanceInput | None = None


# --------------------------------------------------------------------------- #
# Filme — saída
# --------------------------------------------------------------------------- #
class MovieOut(BaseModel):
    """Versão enxuta para listagens."""

    model_config = ConfigDict(from_attributes=True)

    sk_movie_id: str
    id_filme: str
    titulo: str
    ano_lancamento: int | None = None
    url_poster: str | None = None
    generos: list[str] = Field(default_factory=list)
    nota_media_usuarios: float | None = None
    qtd_avaliacoes_usuarios: int = 0


class MovieDetailOut(MovieOut):
    """Versão completa para a página de detalhes."""

    data_lancamento: date | None = None
    duracao_minutos: int | None = None
    status_filme: str | None = None
    sinopse: str | None = None
    url_backdrop: str | None = None
    produtoras: list[str] = Field(default_factory=list)
    pessoas: list[PersonOut] = Field(default_factory=list)
    performance: PerformanceOut | None = None
    reviews: list[ReviewOut] = Field(default_factory=list)


class PaginatedMovies(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[MovieOut]