import { Link } from "react-router-dom";
import type { MovieOut } from "../types";

interface Props {
  movie: MovieOut;
}

function MovieCard({ movie }: Props) {
  return (
    <Link
      to={`/movies/${movie.sk_movie_id}`}
      className="group block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="aspect-[2/3] bg-slate-200 overflow-hidden">
        {movie.url_poster ? (
          <img
            src={movie.url_poster}
            alt={movie.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Sem pôster
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-slate-800 truncate" title={movie.titulo}>
          {movie.titulo}
        </h3>
        <p className="text-sm text-slate-500">
          {movie.ano_lancamento ?? "—"}
        </p>

        {movie.generos.length > 0 && (
          <p className="text-xs text-slate-400 truncate mt-1">
            {movie.generos.slice(0, 2).join(" · ")}
          </p>
        )}

        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className="text-amber-500">★</span>
          <span className="font-medium text-slate-700">
            {movie.nota_media_usuarios?.toFixed(1) ?? "—"}
          </span>
          <span className="text-slate-400 text-xs">
            ({movie.qtd_avaliacoes_usuarios})
          </span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;