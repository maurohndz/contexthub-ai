# Architecture Overview

Ágora is a pnpm-workspaces monorepo with a TypeScript backend and frontend
that share HTTP contracts through a types package.

```
apps/backend          → Express 5 + Prisma API (hexagonal DDD by contexts)
apps/frontend         → React 18 + Vite (features with ports and adapters)
packages/shared-types → HTTP contract DTOs + realtime event types (no logic)
```

The authoritative, always-current rulebook for this architecture is
[AGENTS.md](../../AGENTS.md) at the repo root. This page is the guided
tour; AGENTS.md is the law.

## Backend: hexagonal DDD by contexts

Every capability lives in a bounded context, split into modules, each with
four layers:

```
contexts/<context>/modules/<module>/
  domain/      → models, catalogs, errors. No infrastructure imports, ever.
  ports/       → interfaces the module needs from the outside world.
  use-cases/   → one folder per use case; dependencies injected via constructor.
  infra/       → adapters implementing the ports (Prisma, Redis, external HTTP).
```

Current contexts:

| Context | Modules / responsibility |
|---|---|
| `identity` | auth (sessions), organizations, AI provider credentials |
| `knowledge-management` | documents (ingestion pipeline), projects/spaces |
| `ai` | chat (conversations, RAG, LLM calls) |
| `parameters` | catalogs (e.g. document classifications) |

Key rules (see AGENTS.md for the full list):

- `domain/` and `use-cases/` never import Prisma, Redis, Express, or `env`.
- Cross-context needs are expressed as **local ports**; only `infra/`
  adapters (as anti-corruption layers) and the composition root may import
  across contexts.
- `infrastructure/container.ts` is the **only composition root** — the one
  place where use cases are instantiated and wired.
- HTTP routes stay thin: validate shape → call use case → map domain
  errors to status codes with `instanceof`.

## Frontend: features with ports and adapters

The frontend mirrors the same discipline per feature:

```
features/<feature>/
  domain/       → model types (no dependencies)
  ports/        → API client interface
  infra/        → http-*.adapter.ts (the only place that knows URLs and DTOs)
  application/  → hooks (use-*.ts) and zustand stores
  components/   → pure React; consume hooks, never call fetch
```

Backend DTOs come from `@contexthub-ai/shared-types` and are mapped to
domain types inside the adapter — components never see a raw DTO.

## Realtime: SSE over Redis pub/sub

Queries that fill UI sections are **atomic on purpose** so they can be
invalidated individually:

1. A use case that mutates visible data publishes an event through its
   module's realtime notifier port.
2. The infra adapter publishes to Redis pub/sub, targeting the right
   audience (org-wide for documents/spaces; owner-only for conversations).
3. The backend fans events out to browsers over **Server-Sent Events**
   (`/api/events`).
4. Frontend stores subscribed via `subscribeRealtime` refetch their own
   atomic query — **events say *what* changed; state always comes from a
   refetch, never from the event payload.**

## Background work: BullMQ

Document processing (text extraction → chunking → embeddings) runs in a
Redis-backed BullMQ queue so uploads return immediately; progress reaches
the UI through the same SSE channel.

## Persistence

PostgreSQL 18 with pgvector, four schemas (`security`, `main`, `ai`,
`parameters`), managed by Prisma with hand-versioned migrations. See
[data-model.md](data-model.md).

## Read next

- [knowledge-pipeline.md](knowledge-pipeline.md) — the ingestion/retrieval flow end to end.
- [traceability-and-citations.md](traceability-and-citations.md) — grounding guarantees.
- [ai-providers.md](ai-providers.md) — provider integration and the Phase 1 abstraction.
- [decisions/](decisions/) — why things are the way they are.
