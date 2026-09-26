import { Link, useNavigate, useParams } from "react-router-dom";
import { useMovie, useUpdateMovie } from "../api/hooks";
import MovieForm from "../components/MovieForm";
import type { MovieUpdate } from "../types";

function MovieEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError, error } = useMovie(id);
  const updateMutation = useUpdateMovie(id ?? "");

  const handleSubmit = (payload: MovieUpdate) => {
    updateMutation.mutate(payload, {
      onSuccess: () => {
        navigate(`/movies/${id}`);
      },
    });
  };

  if (isLoading) {
    return <p className="p-6 text-slate-500">Carregando filme...</p>;
  }

  if (isError || !movie) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm">
          ← Voltar ao catálogo
        </Link>
        <p className="text-red-600 mt-4">Erro ao carregar filme: {String(error)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-6 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            to={`/movies/${id}`}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Voltar aos detalhes
          </Link>
          <h1 className="text-3xl font-bold mt-2">Editar filme</h1>
          <p className="text-slate-400 text-sm mt-1 truncate">{movie.titulo}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        <MovieForm
          mode="edit"
          initialValues={movie}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.isError ? updateMutation.error : null}
        />
      </main>
    </div>
  );
}

export default MovieEditPage;