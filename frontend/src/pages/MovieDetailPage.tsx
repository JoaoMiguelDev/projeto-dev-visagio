import { Link, useParams } from "react-router-dom";
import { useMovie } from "../api/hooks";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import DeleteButton from "../components/DeleteButton";

function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading, isError, error } = useMovie(id);

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

  const diretores = movie.pessoas.filter((p) => p.tipo_pessoa === "Diretor");
  const atores = movie.pessoas.filter((p) => p.tipo_pessoa === "Ator");
  const roteiristas = movie.pessoas.filter((p) => p.tipo_pessoa === "Roteirista");

  return (
    <div className="min-h-screen bg-slate-50">
      {movie.url_backdrop && (
        <div className="relative h-64 sm:h-80 overflow-hidden bg-slate-900">
          <img
            src={movie.url_backdrop}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative">
        <div className="flex items-center justify-between mb-4 gap-3">
          <Link
            to="/"
            className="text-slate-200 hover:text-white text-sm bg-slate-800/80 px-3 py-1 rounded"
          >
            ← Voltar ao catálogo
          </Link>

          <div className="flex gap-2">
            <Link
              to={`/movies/${movie.sk_movie_id}/edit`}
              className="text-sm bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1 rounded"
            >
              Editar
            </Link>
            <DeleteButton skMovieId={movie.sk_movie_id} titulo={movie.titulo} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <div className="aspect-[2/3] bg-slate-200 rounded overflow-hidden">
            {movie.url_poster ? (
              <img
                src={movie.url_poster}
                alt={movie.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Sem pôster
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {movie.titulo}{" "}
              {movie.ano_lancamento && (
                <span className="text-slate-400 font-normal">
                  ({movie.ano_lancamento})
                </span>
              )}
            </h1>

            {movie.generos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {movie.generos.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl text-amber-500">★</span>
              <span className="text-2xl font-bold text-slate-800">
                {movie.nota_media_usuarios?.toFixed(1) ?? "—"}
              </span>
              <span className="text-slate-500 text-sm">
                ({movie.qtd_avaliacoes_usuarios}{" "}
                {movie.qtd_avaliacoes_usuarios === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {diretores.length > 0 && (
                <>
                  <dt className="text-slate-500">Direção</dt>
                  <dd className="text-slate-800">
                    {diretores.map((d) => d.nome_pessoa).join(", ")}
                  </dd>
                </>
              )}
              {roteiristas.length > 0 && (
                <>
                  <dt className="text-slate-500">Roteiro</dt>
                  <dd className="text-slate-800">
                    {roteiristas.map((p) => p.nome_pessoa).join(", ")}
                  </dd>
                </>
              )}
              {movie.duracao_minutos && (
                <>
                  <dt className="text-slate-500">Duração</dt>
                  <dd className="text-slate-800">{movie.duracao_minutos} min</dd>
                </>
              )}
              {movie.data_lancamento && (
                <>
                  <dt className="text-slate-500">Lançamento</dt>
                  <dd className="text-slate-800">
                    {new Date(movie.data_lancamento).toLocaleDateString("pt-BR")}
                  </dd>
                </>
              )}
              {movie.produtoras.length > 0 && (
                <>
                  <dt className="text-slate-500">Produção</dt>
                  <dd className="text-slate-800">
                    {movie.produtoras.join(", ")}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {movie.sinopse && (
          <section className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Sinopse</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {movie.sinopse}
            </p>
          </section>
        )}

        {atores.length > 0 && (
          <section className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Elenco principal
            </h2>
            <div className="flex flex-wrap gap-2">
              {atores.slice(0, 20).map((a) => (
                <span
                  key={a.sk_person_id}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {a.nome_pessoa}
                </span>
              ))}
              {atores.length > 20 && (
                <span className="text-slate-400 text-sm self-center">
                  + {atores.length - 20} outros
                </span>
              )}
            </div>
          </section>
        )}

        {movie.performance && (
          <section className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Performance</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {movie.performance.nota_tmdb != null && (
                <div>
                  <dt className="text-slate-500">Nota TMDB</dt>
                  <dd className="text-slate-800 font-medium">
                    {movie.performance.nota_tmdb.toFixed(1)}
                  </dd>
                </div>
              )}
              {movie.performance.nota_imdb != null && (
                <div>
                  <dt className="text-slate-500">Nota IMDB</dt>
                  <dd className="text-slate-800 font-medium">
                    {movie.performance.nota_imdb.toFixed(1)}
                  </dd>
                </div>
              )}
              {movie.performance.popularidade != null && (
                <div>
                  <dt className="text-slate-500">Popularidade</dt>
                  <dd className="text-slate-800 font-medium">
                    {movie.performance.popularidade.toFixed(0)}
                  </dd>
                </div>
              )}
              {movie.performance.receita_usd && (
                <div>
                  <dt className="text-slate-500">Receita (USD)</dt>
                  <dd className="text-slate-800 font-medium">
                    ${Number(movie.performance.receita_usd).toLocaleString("en-US")}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Avaliações ({movie.qtd_avaliacoes_usuarios})
          </h2>
          <ReviewList reviews={movie.reviews} />
        </section>

        <section className="mt-6 mb-12">
          <ReviewForm skMovieId={movie.sk_movie_id} />
        </section>
      </div>
    </div>
  );
}

export default MovieDetailPage;