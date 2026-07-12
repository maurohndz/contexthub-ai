# Installation (Self-Hosting)

Ágora is designed to run entirely on your own infrastructure. This guide
covers local/self-hosted installation from source.

## Prerequisites

- **Node.js ≥ 20**
- **pnpm ≥ 9** (`corepack enable` if you don't have it)
- **Docker + Docker Compose** — Postgres (with pgvector), Redis, and
  Ollama run as containers

## 1. Clone and install

```bash
git clone https://github.com/maurohndz/contexthub-ai.git agora
cd agora
pnpm install
```

## 2. Configure environments

Three `environments/.env.local` files drive the stack (see
[configuration.md](configuration.md) for every variable):

| File | Configures |
|---|---|
| `environments/.env.local` | Docker infra: Postgres/Redis credentials, ports, embedding model |
| `apps/backend/environments/.env.local` | API: `DATABASE_URL`, `REDIS_URL`, encryption key, embeddings |
| `apps/frontend/environments/.env.local` | Web client: `VITE_API_URL` |

Generate the credentials encryption key with:

```bash
openssl rand -hex 32   # → CREDENTIALS_ENCRYPTION_KEY
```

## 3. Start the infrastructure

```bash
pnpm infra:up
```

This starts:

- **Postgres 18 + pgvector** — the database.
- **Redis 7** — processing queue (BullMQ) + realtime pub/sub (SSE).
- **Ollama** — local embeddings server. The embedding model
  (`nomic-embed-text` by default) is **pulled automatically** by the
  `ollama-init` sidecar on first start; models persist in a Docker volume.

## 4. Run migrations

```bash
pnpm db:migrate:local
```

> ⚠️ Some database objects (the pgvector HNSW index, `uuidv7()` defaults)
> are managed by hand in migrations because Prisma's DSL cannot express
> them. If you develop against the schema, read the Persistence rules in
> [AGENTS.md](../../AGENTS.md) first.

## 5. Start the apps

```bash
pnpm dev:backend    # API on http://localhost:3000
pnpm dev:frontend   # Web app on http://localhost:5173
```

Open http://localhost:5173, create your account, your organization and
your first project, then follow
[ai-provider-setup.md](ai-provider-setup.md) to connect an AI provider.

## Stopping

```bash
pnpm infra:down
```

## Production deployment

The compose file also defines `backend` and `frontend` service images for
containerized deployments.

<!-- TODO(phase-4): document a hardened production topology (reverse proxy,
     TLS, backups, COOKIE_SECURE=true, non-default credentials) as part of
     Open Source Readiness. -->
