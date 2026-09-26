import { useCallback, useState } from "react";
import { useMovies } from "../api/hooks";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";

const ITEMS_PER_PAGE = 20;

function MovieListPage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useMovies({
    skip: page * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE,
    search: search || undefined,
    genre: genre || undefined,
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0); // volta à primeira página ao buscar
  }, []);

  const handleGenreChange = useCallback((value: string) => {
    setGenre(value);
    setPage(0); // volta à primeira página ao filtrar
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-6 mb-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RocketLab Filmes</h1>
            <p className="text-slate-400 text-sm mt-1">
              Catálogo de filmes com avaliações
            </p>
          </div>
          <Link
            to="/movies/new"
            className="px-4 py-2 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-400"
          >
            + Novo filme
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <SearchBar
          onSearchChange={handleSearchChange}
          onGenreChange={handleGenreChange}
          genre={genre}
        />

        {isLoading && (
          <p className="text-center text-slate-500 py-12">Carregando filmes...</p>
        )}

        {isError && (
          <p className="text-center text-red-600 py-12">
            Erro ao carregar filmes: {String(error)}
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            Nenhum filme encontrado com os filtros atuais.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            <p className="text-sm text-slate-500 mb-4">
              {data.total.toLocaleString("pt-BR")} filmes encontrados
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.items.map((movie) => (
                <MovieCard key={movie.sk_movie_id} movie={movie} />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalItems={data.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default MovieListPage;