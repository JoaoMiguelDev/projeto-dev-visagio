import { useState } from "react";
import { useAddReview } from "../api/hooks";

interface Props {
  skMovieId: string;
}

function ReviewForm({ skMovieId }: Props) {
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(8);
  const [comentario, setComentario] = useState("");

  const { mutate, isPending, isError, error, reset } = useAddReview(skMovieId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !comentario.trim()) return;

    mutate(
      { nome: nome.trim(), nota, comentario: comentario.trim() },
      {
        onSuccess: () => {
          setNome("");
          setNota(8);
          setComentario("");
          reset();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-slate-800">
        Adicionar avaliação
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Seu nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={120}
            required
            className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nota (0–10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={nota}
            onChange={(e) => setNota(Number(e.target.value))}
            required
            className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Resenha
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={4000}
          rows={4}
          required
          className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
        />
      </div>

      {isError && (
        <p className="text-sm text-red-600">
          Erro ao enviar: {String(error)}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}

export default ReviewForm;