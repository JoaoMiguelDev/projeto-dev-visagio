import type { ReviewOut } from "../types";

interface Props {
  reviews: ReviewOut[];
}

function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-slate-500 italic">
        Nenhuma avaliação ainda. Seja o primeiro a avaliar!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.sk_movie_review_id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <strong className="text-slate-800">{review.nome}</strong>
            <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-sm font-medium">
              ★ {review.nota.toFixed(1)}
            </span>
          </div>
          <p className="text-slate-700 text-sm whitespace-pre-wrap">
            {review.comentario}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {new Date(review.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default ReviewList;