import { BrowserRouter, Routes, Route } from "react-router-dom";
import MovieListPage from "./pages/MovieListPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MovieCreatePage from "./pages/MovieCreatePage";
import MovieEditPage from "./pages/MovieEditPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/movies/new" element={<MovieCreatePage />} />
        <Route path="/movies/:id/edit" element={<MovieEditPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;