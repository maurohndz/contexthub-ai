# Testing

## Philosophy

Backend unit tests exercise **use cases against in-memory fakes of their
ports** — never against mocks of Prisma. If a use case would need a
Prisma mock, its wiring is wrong: the persistence detail belongs behind a
port. This keeps tests fast, deterministic, and honest about the
architecture.

See `apps/backend/test/unit/fakes/` (e.g. `fake-chat-module.ts`,
`fake-ai-credentials-module.ts`) for reference fakes.

## What every new use case ships with

Tests for, at minimum:

1. **Happy path** — the case does what it promises.
2. **Authorization failures** — non-members / wrong-tenant access is
   rejected.
3. **Domain errors** — each error the case can throw is exercised.

## Running the suites

```bash
# Backend unit tests (Vitest)
cd apps/backend && npx vitest run test/unit

# Backend integration tests (require running infra)
cd apps/backend && npx vitest run test/integration

# Typecheck — required green before any PR
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit

# Everything from the root
pnpm test
```

## Frontend

The frontend currently relies on **strict typechecking** (`tsc --noEmit`)
plus manual verification; it has no component test suite yet.
<!-- TODO: define the frontend testing approach (component tests for
     application hooks/stores are the natural first target). -->

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs typecheck
and unit tests for every push and pull request against the long-lived
branches. Keep it green — PRs with failing CI are not reviewed.
