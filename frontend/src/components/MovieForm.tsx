import { useState } from "react";
import { useGenres } from "../api/hooks";
import type {
  MovieCreate,
  MovieDetailOut,
  MovieUpdate,
  PerformanceInput,
  PersonInput,
  PersonType,
} from "../types";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initialValues?: MovieDetailOut;
  onSubmit: (payload: MovieCreate | MovieUpdate) => void;
  isSubmitting: boolean;
  error: unknown;
}

const PERSON_TYPES: PersonType[] = ["Diretor", "Ator", "Roteirista"];

function MovieForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const { data: genres } = useGenres();

  // ------------------------------------------------------------------------- //
  // Estado básico do filme
  // ------------------------------------------------------------------------- //
  const [form, setForm] = useState({
    id_filme: initialValues?.id_filme ?? "",
    titulo: initialValues?.titulo ?? "",
    ano_lancamento: initialValues?.ano_lancamento ?? new Date().getFullYear(),
    data_lancamento: initialValues?.data_lancamento ?? "",
    duracao_minutos: initialValues?.duracao_minutos ?? "",
    status_filme: initialValues?.status_filme ?? "Lançado",
    sinopse: initialValues?.sinopse ?? "",
    url_poster: initialValues?.url_poster ?? "",
    url_backdrop: initialValues?.url_backdrop ?? "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // ------------------------------------------------------------------------- //
  // Listas (gêneros, produtoras, pessoas)
  // ------------------------------------------------------------------------- //
  const [generos, setGeneros] = useState<string>(
    initialValues?.generos.join(", ") ?? ""
  );
  const [produtoras, setProdutoras] = useState<string>(
    initialValues?.produtoras.join(", ") ?? ""
  );
  const [pessoas, setPessoas] = useState<PersonInput[]>(
    initialValues?.pessoas.map((p) => ({
      nome_pessoa: p.nome_pessoa,
      tipo_pessoa: p.tipo_pessoa,
    })) ?? []
  );

  const addPessoa = () =>
    setPessoas([...pessoas, { nome_pessoa: "", tipo_pessoa: "Ator" }]);

  const removePessoa = (index: number) =>
    setPessoas(pessoas.filter((_, i) => i !== index));

  const updatePessoa = <K extends keyof PersonInput>(
    index: number,
    key: K,
    value: PersonInput[K]
  ) =>
    setPessoas(
      pessoas.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    );

  // ------------------------------------------------------------------------- //
  // Performance (opcional)
  // ------------------------------------------------------------------------- //
  const [showPerformance, setShowPerformance] = useState(!!initialValues?.performance);
  const [performance, setPerformance] = useState({
    orcamento_usd: initialValues?.performance?.orcamento_usd ?? "",
    receita_usd: initialValues?.performance?.receita_usd ?? "",
    lucro_usd: initialValues?.performance?.lucro_usd ?? "0",
    orcamento_brl: initialValues?.performance?.orcamento_brl ?? "",
    receita_brl: initialValues?.performance?.receita_brl ?? "",
    lucro_brl: initialValues?.performance?.lucro_brl ?? "0",
    popularidade: initialValues?.performance?.popularidade ?? "",
    nota_tmdb: initialValues?.performance?.nota_tmdb ?? "",
    qtd_tmdb: initialValues?.performance?.qtd_tmdb ?? "",
    nota_imdb: initialValues?.performance?.nota_imdb ?? "",
    qtd_imdb: initialValues?.performance?.qtd_imdb ?? "",
  });

  const updatePerf = <K extends keyof typeof performance>(
    key: K,
    value: (typeof performance)[K]
  ) => setPerformance((prev) => ({ ...prev, [key]: value }));

  // ------------------------------------------------------------------------- //
  // Submit
  // ------------------------------------------------------------------------- //
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parseNullable = (v: string | number | null | undefined) => {
      if (v === "" || v == null) return null;
      return v;
    };

    const performancePayload: PerformanceInput | null = showPerformance
      ? {
          orcamento_usd: parseNullable(performance.orcamento_usd) as string | null,
          receita_usd: parseNullable(performance.receita_usd) as string | null,
          lucro_usd: performance.lucro_usd || "0",
          orcamento_brl: parseNullable(performance.orcamento_brl) as string | null,
          receita_brl: parseNullable(performance.receita_brl) as string | null,
          lucro_brl: performance.lucro_brl || "0",
          popularidade: parseNullable(performance.popularidade) as number | null,
          nota_tmdb: parseNullable(performance.nota_tmdb) as number | null,
          qtd_tmdb: parseNullable(performance.qtd_tmdb) as number | null,
          nota_imdb: parseNullable(performance.nota_imdb) as number | null,
          qtd_imdb: parseNullable(performance.qtd_imdb) as number | null,
        }
      : null;

    const basePayload = {
      titulo: form.titulo.trim(),
      ano_lancamento: form.ano_lancamento,
      data_lancamento: parseNullable(form.data_lancamento),
      duracao_minutos: parseNullable(form.duracao_minutos) as number | null,
      status_filme: parseNullable(form.status_filme) as string | null,
      sinopse: parseNullable(form.sinopse) as string | null,
      url_poster: parseNullable(form.url_poster) as string | null,
      url_backdrop: parseNullable(form.url_backdrop) as string | null,
      generos: generos
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      produtoras: produtoras
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      pessoas: pessoas.filter((p) => p.nome_pessoa.trim() !== ""),
      performance: performancePayload,
    };

    if (mode === "create") {
      onSubmit({
        id_filme: form.id_filme.trim(),
        ...basePayload,
      } as MovieCreate);
    } else {
      onSubmit(basePayload as MovieUpdate);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* --------------------------------------------------------------- */}
      {/* Dados básicos */}
      {/* --------------------------------------------------------------- */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Dados básicos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === "create" && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID externo (ex: TMDB)
              </label>
              <input
                type="text"
                value={form.id_filme}
                onChange={(e) => update("id_filme", e.target.value)}
                required
                maxLength={50}
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              required
              maxLength={500}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ano de lançamento
            </label>
            <input
              type="number"
              value={form.ano_lancamento}
              onChange={(e) =>
                update(
                  "ano_lancamento",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data de lançamento
            </label>
            <input
              type="date"
              value={form.data_lancamento}
              onChange={(e) => update("data_lancamento", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duração (min)
            </label>
            <input
              type="number"
              value={form.duracao_minutos}
              onChange={(e) =>
                update(
                  "duracao_minutos",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <input
              type="text"
              value={form.status_filme}
              onChange={(e) => update("status_filme", e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL do pôster
            </label>
            <input
              type="url"
              value={form.url_poster}
              onChange={(e) => update("url_poster", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL do backdrop
            </label>
            <input
              type="url"
              value={form.url_backdrop}
              onChange={(e) => update("url_backdrop", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sinopse
            </label>
            <textarea
              value={form.sinopse}
              onChange={(e) => update("sinopse", e.target.value)}
              rows={4}
              maxLength={4000}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- */}
      {/* Classificação */}
      {/* --------------------------------------------------------------- */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Classificação</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gêneros (separados por vírgula)
          </label>
          <input
            type="text"
            value={generos}
            onChange={(e) => setGeneros(e.target.value)}
            placeholder="Ação, Ficção Científica, Drama"
            className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          {genres && genres.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Existentes: {genres.map((g) => g.nome_genero).join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Produtoras (separadas por vírgula)
          </label>
          <input
            type="text"
            value={produtoras}
            onChange={(e) => setProdutoras(e.target.value)}
            placeholder="Warner Bros., Universal Pictures"
            className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
      </section>

      {/* --------------------------------------------------------------- */}
      {/* Pessoas */}
      {/* --------------------------------------------------------------- */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Pessoas</h2>
          <button
            type="button"
            onClick={addPessoa}
            className="text-sm px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            + Adicionar
          </button>
        </div>

        {pessoas.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            Nenhuma pessoa adicionada.
          </p>
        )}

        <ul className="space-y-2">
          {pessoas.map((p, i) => (
            <li key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={p.nome_pessoa}
                onChange={(e) => updatePessoa(i, "nome_pessoa", e.target.value)}
                placeholder="Nome"
                maxLength={255}
                className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <select
                value={p.tipo_pessoa}
                onChange={(e) =>
                  updatePessoa(i, "tipo_pessoa", e.target.value as PersonType)
                }
                className="px-3 py-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {PERSON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removePessoa(i)}
                className="px-3 py-2 rounded-md text-red-600 hover:bg-red-50 font-medium"
                aria-label="Remover"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------------- */}
      {/* Performance */}
      {/* --------------------------------------------------------------- */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Performance (opcional)
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showPerformance}
              onChange={(e) => setShowPerformance(e.target.checked)}
            />
            Incluir
          </label>
        </div>

        {showPerformance && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "orcamento_usd", label: "Orçamento (USD)" },
              { key: "receita_usd", label: "Receita (USD)" },
              { key: "lucro_usd", label: "Lucro (USD)" },
              { key: "orcamento_brl", label: "Orçamento (BRL)" },
              { key: "receita_brl", label: "Receita (BRL)" },
              { key: "lucro_brl", label: "Lucro (BRL)" },
              { key: "popularidade", label: "Popularidade" },
              { key: "nota_tmdb", label: "Nota TMDB" },
              { key: "qtd_tmdb", label: "Qtd TMDB" },
              { key: "nota_imdb", label: "Nota IMDB" },
              { key: "qtd_imdb", label: "Qtd IMDB" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={
                    performance[field.key as keyof typeof performance] as string
                  }
                  onChange={(e) =>
                    updatePerf(
                      field.key as keyof typeof performance,
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------- */}
      {/* Ações */}
      {/* --------------------------------------------------------------- */}
      {error != null && (
        <p className="text-sm text-red-600">
          Erro ao salvar: {String(error)}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "Salvando..."
            : mode === "create"
            ? "Criar filme"
            : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

export default MovieForm;