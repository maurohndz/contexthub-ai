## Why

<!-- The problem this PR solves — reviewers read this first. -->

## What changed

<!-- Summary of the change. Note any AGENTS.md rule you could not follow and why. -->

## How it was verified

<!-- Tests run, flows exercised. -->

## Checklist

- [ ] Branch cut from `develop`, PR targets `develop` (git flow)
- [ ] `npx tsc --noEmit` green in every touched package
- [ ] `npx vitest run test/unit` green (backend)
- [ ] New use cases have tests (happy path, authorization, domain errors)
- [ ] Schema changes: versioned migration + checked against the
      hand-managed objects rule (HNSW index, `uuidv7()` defaults)
- [ ] Response shape changes: shared-types DTO **and** frontend adapter
      updated in this PR
- [ ] Hard-to-reverse design decision? → ADR added in
      `docs/architecture/decisions/`
