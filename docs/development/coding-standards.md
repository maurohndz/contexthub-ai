# Coding Standards

The authoritative rulebook is **[AGENTS.md](../../AGENTS.md)** at the repo
root — it defines the architecture contracts, layer rules, and checklists
for new features, and PRs are reviewed against it. This page is the
orientation summary; when in doubt, AGENTS.md wins.

## Language

- **Everything in the codebase is English**: identifiers, comments,
  JSDoc, commit messages, docs.
- **User-facing strings are the only exception** — UI texts and domain
  error messages shown to end users are in Spanish (the product
  language).
- **JSDoc is required** on every exported class, function, and hook —
  explain intent and constraints, not the signature.

## Backend in one minute

- Structure: `contexts/<context>/modules/<module>/{domain,ports,use-cases,infra}`.
- `domain/` imports nothing external; `use-cases/` depend only on
  `domain/`, `ports/`, `shared/` — adapters are constructor-injected.
- Only `infra/` touches Prisma, Redis, `env`, or external APIs.
- Cross-context access happens through **local ports**, implemented by
  anti-corruption adapters; `infrastructure/container.ts` is the only
  composition root.
- Routes stay thin: validate shape → call use case → map domain errors
  with `instanceof` (403 / 404 / 400 / 409 / 502).

## Frontend in one minute

- Structure: `features/<feature>/{domain,ports,infra,application,components}`.
- Components never call `fetch`; hooks never call `fetch` directly — the
  `infra/` adapter is the only place that knows URLs and DTOs, and it
  maps shared-types DTOs to domain types.
- Cross-feature imports: only `application/` hooks and `domain/` types.
- Realtime: subscribe with `subscribeRealtime`, **refetch your own atomic
  query** — never mutate state from an event payload.

## Naming

- Files: `kebab-case` with role suffixes — `*.use-case.ts`, `*.port.ts`,
  `*.repository.ts`, `*.adapter.ts`, `*.routes.ts`, `use-*.ts`.
- Classes: `Http*Adapter`, `Prisma*Repository`.
- UI says **project**, backend says **space** — on purpose; don't "align"
  them (see the naming glossary in AGENTS.md).

## Commits & branches

- Short imperative subject lines.
- Git flow: `feature/*` from `develop`, PR back into `develop` — see
  [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Decisions

Significant, hard-to-reverse technical decisions are recorded as
[ADRs](../architecture/decisions/).
