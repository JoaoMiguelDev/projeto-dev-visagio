import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReview,
  createMovie,
  deleteMovie,
  getMovie,
  listGenres,
  listMovies,
  listReviews,
  updateMovie,
  type ListMoviesParams,
} from "./movies";
import type { MovieCreate, MovieUpdate, ReviewCreate } from "../types";

// --------------------------------------------------------------------------- //
// Chaves de cache
// --------------------------------------------------------------------------- //
export const queryKeys = {
  movies: (params: ListMoviesParams) => ["movies", params] as const,
  movie: (id: string) => ["movie", id] as const,
  reviews: (id: string) => ["reviews", id] as const,
  genres: () => ["genres"] as const,
};

// --------------------------------------------------------------------------- //
// Queries
// --------------------------------------------------------------------------- //
export function useMovies(params: ListMoviesParams = {}) {
  return useQuery({
    queryKey: queryKeys.movies(params),
    queryFn: () => listMovies(params),
  });
}

export function useMovie(skMovieId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movie(skMovieId ?? ""),
    queryFn: () => getMovie(skMovieId!),
    enabled: !!skMovieId,
  });
}

export function useReviews(skMovieId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews(skMovieId ?? ""),
    queryFn: () => listReviews(skMovieId!),
    enabled: !!skMovieId,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: queryKeys.genres(),
    queryFn: listGenres,
  });
}

// --------------------------------------------------------------------------- //
// Mutations
// --------------------------------------------------------------------------- //
export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MovieCreate) => createMovie(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
}

export function useUpdateMovie(skMovieId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MovieUpdate) => updateMovie(skMovieId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(skMovieId) });
    },
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skMovieId: string) => deleteMovie(skMovieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
}

export function useAddReview(skMovieId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewCreate) => addReview(skMovieId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(skMovieId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(skMovieId) });
    },
  });
}