import { Link, useNavigate } from "react-router-dom";
import { useCreateMovie } from "../api/hooks";
import MovieForm from "../components/MovieForm";
import type { MovieCreate } from "../types";

function MovieCreatePage() {
  const navigate = useNavigate();
  const { mutate, isPending, isError, error } = useCreateMovie();

  const handleSubmit = (payload: MovieCreate) => {
    mutate(payload, {
      onSuccess: (movie) => {
        navigate(`/movies/${movie.sk_movie_id}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-6 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="text-slate-400 hover:text-white text-sm">
            ← Voltar ao catálogo
          </Link>
          <h1 className="text-3xl font-bold mt-2">Novo filme</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        <MovieForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          error={isError ? error : null}
        />
      </main>
    </div>
  );
}

export default MovieCreatePage;