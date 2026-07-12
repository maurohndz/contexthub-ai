# 1. Record architecture decisions

Date: 2026-07-11

## Status

Accepted

## Context

Ágora's whole thesis is that organizational decisions should be preserved
with their context instead of living in people's memories. The project
should practice what it preaches: significant technical decisions made in
this repository need to remain traceable — what was decided, when, in what
context, and which alternatives were considered — long after the original
authors have moved on.

We also already maintain [AGENTS.md](../../../AGENTS.md) as the living
rulebook of architecture contracts. Rules state *what* must hold today;
they do not record *why* a choice was made over its alternatives.

## Decision

We will record significant architecture decisions as **Architecture
Decision Records (ADRs)**, following the format popularized by Michael
Nygard: one short Markdown file per decision, numbered sequentially,
stored in `docs/architecture/decisions/`.

Each ADR contains: **Title**, **Date**, **Status** (Proposed / Accepted /
Deprecated / Superseded by ADR-XXXX), **Context**, **Decision**, and
**Consequences**.

ADRs are immutable history: when a decision changes, a new ADR supersedes
the old one — the old file is marked *Superseded*, never rewritten.

Candidates for an ADR: choices that are expensive to reverse, that
constrain future work, or that a newcomer would ask "why is it like
this?" about (e.g. the provider abstraction design in roadmap Phase 1,
the roles & permissions model in Phase 2).

## Consequences

- The *why* behind structural choices survives team changes — the same
  guarantee Ágora offers its users, applied to itself.
- Reviewers gain a lightweight place to demand rationale ("this needs an
  ADR") without blocking on heavyweight design docs.
- AGENTS.md stays the enforceable rulebook; ADRs hold the reasoning that
  produced those rules. When they overlap, AGENTS.md wins on *current
  law*, the ADR on *historical intent*.
