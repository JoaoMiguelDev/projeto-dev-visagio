# Decisões de projeto

Documento complementar ao `README.md`. Aqui registrei as principais
decisões técnicas que tomei durante o desenvolvimento e o raciocínio
por trás delas.

---

## 🧭 Decisões de projeto

### 1. Manutenção da estrutura do repositório base

O repositório base já vinha organizado por **domínio + camada**:

```
app/
├── api/v1/     # routers
├── core/       # configurações transversais
├── db/         # engine, sessão, Base
└── movies/     # domínio de filmes
```

Optei por **manter essa estrutura** em vez de migrar para o padrão
por camada (todos os modelos em `models.py`, todas as rotas em
`routers/`). Motivos:

- **O schema é complexo.** São 10 tabelas em esquema estrela
  (dimensões, fato, bridges, resumos). Concentrar tudo em arquivos
  únicos geraria arquivos de centenas de linhas.
- **Separação de infraestrutura e negócio.** `core/` e `db/` são
  claramente infraestrutura. `movies/` é o domínio. Essa separação
  evita dependências circulares e facilita testes.
- **Versionamento da API.** A pasta `api/v1/` prepara o projeto para
  evoluções futuras sem quebrar consumidores existentes.
- **Padrão de mercado.** A estrutura por domínio é comum em projetos
  FastAPI profissionais.

### 2. `sqlalchemy[asyncio]` no `pyproject.toml`

Alterei a dependência de:

```toml
"sqlalchemy>=2.0.35"
```

para:

```toml
"sqlalchemy[asyncio]>=2.0.35"
```

**Motivo:** o projeto usa a variante assíncrona do SQLAlchemy
(`AsyncSession`, `create_async_engine`), que depende da biblioteca
`greenlet`. Sem o extra `[asyncio]`, o `greenlet` não é instalado e a
aplicação falha na inicialização com:

```
ImportError: The SQLAlchemy asyncio module requires that the Python
'greenlet' library is installed.
```

Essa alteração garante que qualquer pessoa que clonar o projeto e
rodar `pip install -e ".[dev]"` tenha o ambiente completo.

### 3. Nota no intervalo 0–10

O modelo ORM define explicitamente:

```python
CheckConstraint("nota >= 0 AND nota <= 10", name="nota_range")
```

O enunciado menciona "nota de 1 a 5 estrelas", mas o design original
do banco usa 0–10. Optei por **respeitar o modelo** em vez de
alterá-lo. Motivos:

- O schema é parte da base entregue e não deve ser modificado sem
  necessidade.
- O CSV de reviews usa a escala 0–10 (ex: `9.8`, `2.4`, `7.75`).
- Converter na camada de API adicionaria complexidade desnecessária.

Exibo as notas no front-end com uma casa decimal (`8.3`) e um ícone
de estrela, sem representação visual de "5 estrelas cheias".

### 4. `id_filme` imutável

O campo `id_filme` (identificador externo, geralmente TMDB ou IMDB) é
uma **chave única** e não pode ser alterado após a criação do filme.

**Motivo:** alterar esse campo quebraria referências externas (links,
integrações, dados de outras fontes). O `MovieUpdate` (schema Pydantic)
deliberadamente não inclui `id_filme`. Tentar atualizá-lo retorna
erro de validação.

### 5. `dim_reviews` mantido sempre atualizado

A tabela `dim_reviews` armazena o resumo consolidado por filme:

- `qtd_avaliacoes_usuarios`
- `nota_media_usuarios`

Optei por **atualizar esse resumo dentro da mesma transação** de cada
criação de avaliação, em vez de calcular `AVG()` e `COUNT()` a cada
leitura.

**Motivos:**

- **Performance de leitura.** A listagem de filmes precisa exibir a
  média de cada um. Sem o resumo, cada requisição faria um `JOIN` com
  `movie_reviews` e uma agregação — pesado em 95 mil filmes.
- **Propósito do esquema estrela.** Manter o resumo pré-calculado é o
  padrão em data warehouses.
- **Consistência transacional.** O cálculo é feito na mesma transação
  da inserção. Se algo falhar, tudo é desfeito.

Centralizei o cálculo na função `_recompute_review_summary`, no
`service.py`. Se um dia houver endpoint de exclusão de review, ele
chama a mesma função.

### 6. Seed idempotente e com filtro de FKs órfãs

O script `scripts/seed.py` tem duas características importantes:

**a) Idempotência**

Usa `INSERT ... ON CONFLICT DO NOTHING` do SQLite. Rodar o script
múltiplas vezes não duplica registros. Isso permite reexecutar em caso
de falha sem precisar limpar o banco.

**b) Filtro de FKs órfãs**

Os CSVs fornecidos contêm **referências órfãs**: linhas em tabelas de
associação (`bridge_*`), em `fact_movies_performance`, em
`movie_reviews` e em `dim_reviews` que apontam para IDs de filmes,
pessoas ou produtoras ausentes nas tabelas de dimensão.

Exemplo real: `bridge_movie_person` tem 745.450 linhas, mas apenas
~95.000 filmes e ~424.000 pessoas. Nem todas as combinações existem.

Optei por **descartar silenciosamente** essas linhas, imprimindo um
relatório (`X/Y linhas válidas`) para auditoria. Alternativas
consideradas:

- **Falhar o seed inteiro:** pouco prático, já que os órfãos são
  inconsistências da camada de origem.
- **Criar registros fantasma nas dimensões:** poluiria os dados com
  entidades sem informação.
- **Ignorar o erro e inserir mesmo assim:** impossível — o SQLite
  rejeita com `FOREIGN KEY constraint failed`.

### 7. Otimização da busca por diretor

A primeira versão da busca usava:

```python
models.DimMovie.people.any(
    (models.DimPerson.tipo_pessoa == "Diretor")
    & (models.DimPerson.nome_pessoa.ilike(f"%{search}%"))
)
```

Isso gera um `EXISTS` correlacionado: para cada um dos 95 mil filmes,
o SQLite roda uma subquery que faz lookup na bridge (745 mil linhas)
e na tabela de pessoas (424 mil). Resultado: **~36 segundos** por
consulta.

A versão otimizada usa uma **subquery independente** com `IN`:

```python
director_movie_ids = (
    select(bridge_movie_person.c.sk_movie_id)
    .select_from(bridge_movie_person)
    .join(DimPerson, ...)
    .where(
        DimPerson.tipo_pessoa == "Diretor",
        DimPerson.nome_pessoa.like(pattern),
    )
)
base = base.where(
    or_(
        DimMovie.titulo.like(pattern),
        DimMovie.sk_movie_id.in_(director_movie_ids),
    )
)
```

Resultado: **~500ms**. A subquery roda **uma vez** (não 95 mil vezes),
e o `IN` usa os índices de `sk_movie_id`.

Também troquei `ilike` por `like` (o SQLite já é case-insensitive
para ASCII por padrão) e validei que o `count` duplicado não era
gargalo.

### 8. CSVs de seed fora do Git

Os arquivos CSV ultrapassam o limite prático do GitHub (100 MB por
arquivo, 1 GB por repositório, e sincronização lenta em clones).

**Decisão:** mantive os CSVs em `backend/data/`, ignorados pelo
`.gitignore`, com um `README.md` explicando a origem.

O `.gitignore` inclui exceção para `backend/data/sample/`, caso no
futuro eu queira versionar uma amostra pequena.

### 9. ESLint em vez de Oxlint

O template Vite oferece duas opções. Escolhi **ESLint** por:

- **Ecossistema maior.** Plugins para React Hooks, TypeScript, etc.
- **Padrão do mercado.** A maioria das empresas usa ESLint.
- **Curva de aprendizado produtiva.** Estou aprendendo e o ESLint
  expõe o "porquê" de cada regra, em vez de esconder.

Oxlint é mais rápido (50–100x), mas com ecossistema menor e
configuração mais limitada. Para este projeto, a diferença de
velocidade não é crítica.

### 10. Tailwind CSS para estilização

Adotei **Tailwind CSS 4** em vez de CSS Modules ou CSS puro.

**Motivos:**

- **Velocidade de desenvolvimento.** Escrever estilos inline no
  `className` elimina alternância entre arquivos.
- **Responsividade trivial.** `md:grid-cols-4` resolve em uma linha.
- **Consistência visual.** O design system do Tailwind evita
  decisões ad-hoc de cor, espaçamento, tipografia.
- **Padrão do mercado.** Aparece em muitas vagas.

A v4 tem setup mais simples que a v3 (sem `tailwind.config.js`, sem
`postcss.config.js` — apenas o plugin do Vite e o `@import`).

### 11. React Query para estado de servidor

Usei **TanStack Query** em vez de `useEffect` + `useState`.

**Motivos:**

- **Cache automático.** Dados ficam em cache por 1 minuto
  (`staleTime`). Voltar para a listagem é instantâneo.
- **Invalidação declarativa.** Após criar/editar/excluir, o cache é
  invalidado com uma linha (`queryClient.invalidateQueries`).
- **Estados prontos.** `isLoading`, `isError`, `isSuccess` sem
  precisar gerenciar manualmente.
- **Menos código.** Cada operação reduz a ~15 linhas em vez de
  ~40 com `useEffect`.

Isso foi decisivo num projeto onde as requisições ao back-end podem
ser mais lentas (full scan em 95 mil filmes).

### 12. Ordenação padrão por ano decrescente

A listagem de filmes ordena por `ano_lancamento DESC` com
`titulo ASC` como critério de desempate.

**Motivos:**

- **Catálogos priorizam lançamentos recentes.** É o padrão de
  Letterboxd, IMDb, Netflix.
- **Desempate determinístico.** Sem o segundo critério, dois filmes
  do mesmo ano poderiam alternar de posição entre chamadas,
  quebrando a paginação.

### 13. Paginação por `skip`/`limit`

Escolhi `skip`/`limit` em vez de `page`/`size` por ser o padrão
idiomático do FastAPI e do `OFFSET`/`LIMIT` do SQL.

**Contrapartida:** em páginas muito profundas (ex: `skip=100000`), o
SQLite precisa varrer todas as linhas anteriores. Para este projeto
(95 mil filmes), aceitável. Para volumes maiores, seria necessário
cursor-based pagination.

### 14. Sem autenticação

A aplicação não possui autenticação. Qualquer pessoa pode criar,
editar, excluir filmes e adicionar avaliações.

**Motivos:**

- **O escopo do enunciado não menciona autenticação.**
- **O modelo não tem tabela de usuários.** A avaliação guarda apenas
  o `nome` como string livre — não há vínculo com conta.
- **Uso local e didático.** Adicionar JWT, tabela de usuários, fluxo
  de login e proteção de rotas dobraria o escopo sem agregar aos
  objetivos de aprendizado principais.

Autenticação é uma evolução natural, mas fora do escopo desta
atividade.

---

## 📌 Considerações finais

Priorizei **simplicidade e clareza** sobre otimização prematura. As
decisões foram tomadas para:

- **Aproveitar o schema existente** em vez de remodelá-lo.
- **Minimizar complexidade** onde o escopo não exige.
- **Otimizar apenas onde havia impacto real** (ex: busca por diretor).
- **Documentar o que ficou de fora** para que futuras evoluções
  saibam onde atacar.