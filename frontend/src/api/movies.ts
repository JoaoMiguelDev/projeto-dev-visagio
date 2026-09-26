import api from "./client";
import type {
  GenreOut,
  MovieCreate,
  MovieDetailOut,
  MovieUpdate,
  PaginatedMovies,
  ReviewCreate,
  ReviewOut,
} from "../types";

const API_PREFIX = "/api/v1";

// --------------------------------------------------------------------------- //
// Parâmetros de listagem
// --------------------------------------------------------------------------- //
export interface ListMoviesParams {
  skip?: number;
  limit?: number;
  search?: string;
  genre?: string;
}

// --------------------------------------------------------------------------- //
// Filmes
// --------------------------------------------------------------------------- //
export async function listMovies(
  params: ListMoviesParams = {}
): Promise<PaginatedMovies> {
  const { data } = await api.get<PaginatedMovies>(`${API_PREFIX}/movies/`, {
    params,
  });
  return data;
}

export async function getMovie(skMovieId: string): Promise<MovieDetailOut> {
  const { data } = await api.get<MovieDetailOut>(
    `${API_PREFIX}/movies/${skMovieId}`
  );
  return data;
}

export async function createMovie(payload: MovieCreate): Promise<MovieDetailOut> {
  const { data } = await api.post<MovieDetailOut>(
    `${API_PREFIX}/movies/`,
    payload
  );
  return data;
}

export async function updateMovie(
  skMovieId: string,
  payload: MovieUpdate
): Promise<MovieDetailOut> {
  const { data } = await api.put<MovieDetailOut>(
    `${API_PREFIX}/movies/${skMovieId}`,
    payload
  );
  return data;
}

export async function deleteMovie(skMovieId: string): Promise<void> {
  await api.delete(`${API_PREFIX}/movies/${skMovieId}`);
}

// --------------------------------------------------------------------------- //
// Avaliações
// --------------------------------------------------------------------------- //
export async function listReviews(skMovieId: string): Promise<ReviewOut[]> {
  const { data } = await api.get<ReviewOut[]>(
    `${API_PREFIX}/movies/${skMovieId}/reviews`
  );
  return data;
}

export async function addReview(
  skMovieId: string,
  payload: ReviewCreate
): Promise<ReviewOut> {
  const { data } = await api.post<ReviewOut>(
    `${API_PREFIX}/movies/${skMovieId}/reviews`,
    payload
  );
  return data;
}

// --------------------------------------------------------------------------- //
// Gêneros
// --------------------------------------------------------------------------- //
export async function listGenres(): Promise<GenreOut[]> {
  const { data } = await api.get<GenreOut[]>(`${API_PREFIX}/genres/`);
  return data;
}