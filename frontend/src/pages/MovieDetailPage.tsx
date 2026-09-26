import { useParams } from "react-router-dom";

function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalhes do filme</h1>
      <p className="text-gray-600">ID: {id}</p>
    </div>
  );
}

export default MovieDetailPage;