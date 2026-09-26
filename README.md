# 🎬 RocketLab Filmes

Aplicação full-stack para gerenciar um catálogo de filmes com avaliações
(notas e resenhas). Inspirada em plataformas como o Letterboxd, permite
navegar, buscar, cadastrar, editar e remover filmes, além de adicionar
avaliações e visualizar a média geral de cada um.

---

## 🛠 Tecnologias

**Back-end**
- [FastAPI](https://fastapi.tiangolo.com/) — framework web assíncrono
- [SQLAlchemy 2.0](https://www.sqlalchemy.org/) — ORM com suporte a async
- [Alembic](https://alembic.sqlalchemy.org/) — migrações de banco
- [SQLite](https://www.sqlite.org/) — banco de dados local
- [Pydantic 2](https://docs.pydantic.dev/) — validação e serialização

**Front-end**
- [Vite](https://vitejs.dev/) — build tool
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/) — roteamento
- [TanStack Query](https://tanstack.com/query) — cache e estado de requisições
- [Tailwind CSS 4](https://tailwindcss.com/) — estilização
- [Axios](https://axios-http.com/) — cliente HTTP

---

## 📁 Estrutura

```
rocketlab2026-2/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # routers da API
│   │   ├── core/            # configurações e logging
│   │   ├── db/              # Base, engine, sessão assíncrona
│   │   └── movies/          # domínio: models, schemas, service, router
│   ├── data/                # CSVs de seed (não versionados)
│   ├── migrations/          # revisões do Alembic
│   ├── scripts/             # seed.py (carga dos CSVs)
│   └── tests/               # testes automatizados
└── frontend/
    └── src/
        ├── api/             # cliente axios + hooks React Query
        ├── components/      # componentes reutilizáveis
        ├── hooks/           # hooks customizados
        ├── pages/           # páginas da aplicação
        └── types/           # tipos TypeScript
```

---

## ✅ Pré-requisitos

- **Python 3.11+**
- **Node.js 20+** (recomendado 22 LTS)
- **npm 10+**
- **SQLite** (linha de comando, opcional, para inspeção)

---

## 🚀 Como executar

### Back-end

A partir da pasta `backend/`:

```bash
# 1. Criar e ativar o ambiente virtual
python -m venv .venv

# Linux/macOS
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# 2. Instalar dependências
pip install -e ".[dev]"

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Criar o schema do banco
alembic upgrade head

# 5. Popular o banco com os CSVs (ver seção abaixo)
python -m scripts.seed

# 6. Subir a API
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.
Documentação interativa: `http://localhost:8000/docs`.

### Seed dos CSVs

Os CSVs de dados **não são versionados**. Para obtê-los, consulte o
instrutor do curso. Uma vez em mãos, coloque-os em `backend/data/` e rode:

```bash
cd backend
python -m scripts.seed
```

O script é idempotente: rodar mais de uma vez não duplica registros.

### Front-end

A partir da pasta `frontend/`:

```bash
# 1. Instalar dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

> **Importante:** o back-end precisa estar rodando para o front-end funcionar.

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/movies/` | Lista filmes (paginação, busca, filtro por gênero) |
| `POST` | `/api/v1/movies/` | Cria filme |
| `GET` | `/api/v1/movies/{id}` | Detalhes de um filme |
| `PUT` | `/api/v1/movies/{id}` | Atualiza filme |
| `DELETE` | `/api/v1/movies/{id}` | Remove filme |
| `GET` | `/api/v1/movies/{id}/reviews` | Lista avaliações de um filme |
| `POST` | `/api/v1/movies/{id}/reviews` | Adiciona avaliação |
| `GET` | `/api/v1/genres/` | Lista gêneros disponíveis |

**Parâmetros de listagem** (`GET /api/v1/movies/`):
- `skip` (int, ≥0) — registros a pular (padrão 0)
- `limit` (int, 1–100) — tamanho da página (padrão 20)
- `search` (string) — busca por título ou diretor
- `genre` (string) — filtra por gênero exato

---

## 🧪 Testes

Para rodar os testes do back-end:

```bash
cd backend
pytest
```

---

## 📄 Licença

Este projeto foi desenvolvido como atividade do curso RocketLab 2026.2.