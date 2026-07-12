# Development Setup

Local environment for contributing to Ágora. If you only want to *run*
Ágora, [deployment/installation.md](../deployment/installation.md) is
enough — this page adds the contributor workflow on top.

## Prerequisites

- Node.js ≥ 20, pnpm ≥ 9 (`corepack enable`)
- Docker + Docker Compose

## Bootstrap

```bash
git clone https://github.com/maurohndz/contexthub-ai.git agora
cd agora
pnpm install

# infra: Postgres (pgvector) + Redis + Ollama (embedding model auto-pulled)
pnpm infra:up

# database
pnpm db:migrate:local

# apps (two terminals)
pnpm dev:backend    # tsx watch — restarts on change
pnpm dev:frontend   # Vite dev server with HMR
```

Environment files live in `environments/` at the root and inside each
app; see [deployment/configuration.md](../deployment/configuration.md)
for every variable.

## Everyday commands

| Command | Where | What |
|---|---|---|
| `npx vitest run test/unit` | `apps/backend` | Backend unit tests |
| `npx tsc --noEmit` | `apps/backend` / `apps/frontend` | Typecheck |
| `pnpm db:migrate:local` | root | Apply/create Prisma migrations |
| `pnpm --filter @contexthub-ai/backend db:studio:local` | root | Prisma Studio |
| `pnpm infra:down` | root | Stop containers |

## Read before your first PR

1. **[AGENTS.md](../../AGENTS.md)** — the architecture contracts
   (hexagonal layers, dependency rules, naming). Non-negotiable; PRs are
   reviewed against it.
2. [coding-standards.md](coding-standards.md) — the short version with
   pointers.
3. [../../CONTRIBUTING.md](../../CONTRIBUTING.md) — git flow and PR
   checklist.

## Gotchas

- **Prisma migrations:** the HNSW index and `uuidv7()` defaults are not
  representable in the Prisma DSL — `prisma migrate dev` will try to drop
  them as drift. Read the generated SQL and remove those drops before
  applying (Persistence rules in AGENTS.md).
- **Raw SQL inserts** bypass Prisma's `@updatedAt`; set `updated_at`
  explicitly.
- **Branches:** all work happens on `feature/*` branches cut from
  `develop` — never commit directly to the long-lived branches.
