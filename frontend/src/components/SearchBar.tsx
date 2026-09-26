import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useGenres } from "../api/hooks";

interface Props {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  genre: string;
}

function SearchBar({ onSearchChange, onGenreChange, genre }: Props) {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 500);
  const { data: genres } = useGenres();

  useEffect(() => {
    onSearchChange(debouncedInput);
  }, [debouncedInput, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Buscar por título ou diretor..."
        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
      />

      <select
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
      >
        <option value="">Todos os gêneros</option>
        {genres?.map((g) => (
          <option key={g.sk_genre_id} value={g.nome_genero}>
            {g.nome_genero}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;