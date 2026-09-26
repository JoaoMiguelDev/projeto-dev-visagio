import { useNavigate } from "react-router-dom";
import { useDeleteMovie } from "../api/hooks";

interface Props {
  skMovieId: string;
  titulo: string;
}

function DeleteButton({ skMovieId, titulo }: Props) {
  const navigate = useNavigate();
  const { mutate, isPending } = useDeleteMovie();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${titulo}"?\n\nTodas as avaliações desse filme também serão removidas.`
    );
    if (!confirmed) return;

    mutate(skMovieId, {
      onSuccess: () => navigate("/"),
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm bg-red-600/90 hover:bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}

export default DeleteButton;