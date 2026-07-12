# Contributing to Ágora

Thanks for your interest in improving Ágora! This guide covers the
workflow; the architecture rules live in [AGENTS.md](AGENTS.md) and the
contributor docs in [docs/development/](docs/development/).

## Ground rules

- **Read [AGENTS.md](AGENTS.md) before your first PR.** It defines the
  architecture contracts (hexagonal layers, dependency rules, naming) that
  reviews enforce. If a change cannot follow a rule, explain why in the
  PR — never ignore it silently.
- Code, comments, JSDoc, commits and docs are in **English**; user-facing
  UI strings are in **Spanish** (the product language).
- Be respectful — see the [Code of Conduct](CODE_OF_CONDUCT.md).

## Git flow

Work happens on four long-lived branches:

```
main → preprod → qa → develop        (promotion flows upward: develop → qa → preprod → main)
```

1. Fork (or branch) and cut your branch **from `develop`**:
   ```bash
   git checkout -b feature/my-change develop
   ```
   Use `feature/*` for features, `fix/*` for fixes; only urgent production
   `hotfix/*` branches may start from `main`.
2. Open your Pull Request **against `develop`**.
3. Never commit directly to `develop`, `qa`, `preprod` or `main`.

## Local environment

Follow [docs/development/setup.md](docs/development/setup.md). Short
version:

```bash
pnpm install
pnpm infra:up            # Postgres + Redis + Ollama (model auto-pulled)
pnpm db:migrate:local
pnpm dev:backend & pnpm dev:frontend
```

## Before you push

- [ ] Typecheck is green in every package you touched:
      `npx tsc --noEmit` in `apps/backend` and/or `apps/frontend`
- [ ] Backend tests pass: `cd apps/backend && npx vitest run test/unit`
- [ ] New use cases ship with tests (happy path, authorization failures,
      domain errors) using in-memory fakes — never Prisma mocks
- [ ] Schema changes ship as versioned Prisma migrations, and you checked
      the generated SQL against the hand-managed objects rule in AGENTS.md
- [ ] Backend response changes update the DTO in `packages/shared-types`
      **and** the frontend adapter mapping in the same PR

## Pull request expectations

- Clear description of **why** the change exists, not just what it does.
- Short imperative commit subjects.
- Significant, hard-to-reverse design choices get an
  [ADR](docs/architecture/decisions/).
- Keep PRs focused; unrelated cleanups belong in their own PR.

## Reporting issues

Use the issue templates. For security vulnerabilities, **do not open a
public issue** — follow [SECURITY.md](SECURITY.md).
