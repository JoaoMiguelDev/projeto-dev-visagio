export type PersonType = "Ator" | "Diretor" | "Roteirista";

// --------------------------------------------------------------------------- //
// Pessoa, gênero, produtora
// --------------------------------------------------------------------------- //
export interface PersonInput {
  nome_pessoa: string;
  tipo_pessoa: PersonType;
}

export interface PersonOut {
  sk_person_id: string;
  nome_pessoa: string;
  tipo_pessoa: PersonType;
}

export interface GenreOut {
  sk_genre_id: string;
  nome_genero: string;
}

export interface CompanyOut {
  sk_company_id: string;
  nome_produtora: string;
}

// --------------------------------------------------------------------------- //
// Performance
// --------------------------------------------------------------------------- //
export interface PerformanceInput {
  orcamento_usd?: string | null;
  receita_usd?: string | null;
  lucro_usd?: string;
  orcamento_brl?: string | null;
  receita_brl?: string | null;
  lucro_brl?: string;
  popularidade?: number | null;
  nota_tmdb?: number | null;
  qtd_tmdb?: number | null;
  nota_imdb?: number | null;
  qtd_imdb?: number | null;
}

export interface PerformanceOut extends PerformanceInput {
  sk_movie_id: string;
  lucro_usd: string;
  lucro_brl: string;
}

// --------------------------------------------------------------------------- //
// Avaliações
// --------------------------------------------------------------------------- //
export interface ReviewCreate {
  nome: string;
  nota: number;
  comentario: string;
}

export interface ReviewOut {
  sk_movie_review_id: string;
  sk_movie_id: string;
  nome: string;
  nota: number;
  comentario: string;
  created_at: string;
}

// --------------------------------------------------------------------------- //
// Filme — entrada
// --------------------------------------------------------------------------- //
export interface MovieBase {
  id_filme: string;
  titulo: string;
  data_lancamento?: string | null;
  ano_lancamento?: number | null;
  duracao_minutos?: number | null;
  status_filme?: string | null;
  sinopse?: string | null;
  url_poster?: string | null;
  url_backdrop?: string | null;
}

export interface MovieCreate extends MovieBase {
  generos: string[];
  produtoras: string[];
  pessoas: PersonInput[];
  performance?: PerformanceInput | null;
}

export interface MovieUpdate {
  titulo?: string;
  data_lancamento?: string | null;
  ano_lancamento?: number | null;
  duracao_minutos?: number | null;
  status_filme?: string | null;
  sinopse?: string | null;
  url_poster?: string | null;
  url_backdrop?: string | null;
  generos?: string[];
  produtoras?: string[];
  pessoas?: PersonInput[];
  performance?: PerformanceInput | null;
}

// --------------------------------------------------------------------------- //
// Filme — saída
// --------------------------------------------------------------------------- //
export interface MovieOut {
  sk_movie_id: string;
  id_filme: string;
  titulo: string;
  ano_lancamento: number | null;
  url_poster: string | null;
  generos: string[];
  nota_media_usuarios: number | null;
  qtd_avaliacoes_usuarios: number;
}

export interface MovieDetailOut extends MovieOut {
  data_lancamento: string | null;
  duracao_minutos: number | null;
  status_filme: string | null;
  sinopse: string | null;
  url_backdrop: string | null;
  produtoras: string[];
  pessoas: PersonOut[];
  performance: PerformanceOut | null;
  reviews: ReviewOut[];
}

// --------------------------------------------------------------------------- //
// Paginação
// --------------------------------------------------------------------------- //
export interface PaginatedMovies {
  total: number;
  skip: number;
  limit: number;
  items: MovieOut[];
}