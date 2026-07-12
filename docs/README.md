# Ágora Documentation

Welcome to the Ágora documentation. It is organized by audience and purpose.

## Where to go

| I want to… | Read |
|---|---|
| Understand what Ágora is and why it exists | [product/overview.md](product/overview.md) |
| See where the project is heading | [roadmap.md](roadmap.md) |
| Self-host Ágora | [deployment/installation.md](deployment/installation.md) |
| Use the product day to day | [usage/getting-started.md](usage/getting-started.md) |
| Understand how it works internally | [architecture/overview.md](architecture/overview.md) |
| Contribute code | [development/setup.md](development/setup.md) and [../CONTRIBUTING.md](../CONTRIBUTING.md) |

## Sections

### [product/](product/) — the what & why

- [overview.md](product/overview.md) — the problem, the value proposition, what Ágora is (and is not).
- [vision-and-mission.md](product/vision-and-mission.md) — the core idea driving the project.
- [principles.md](product/principles.md) — product principles that constrain every technical decision.
- [use-cases.md](product/use-cases.md) — primary use cases with concrete examples.
- [glossary.md](product/glossary.md) — shared vocabulary.

### [architecture/](architecture/) — how it works technically

- [overview.md](architecture/overview.md) — monorepo layout, hexagonal architecture, realtime design.
- [knowledge-pipeline.md](architecture/knowledge-pipeline.md) — ingestion → chunking → embeddings → retrieval → answer.
- [traceability-and-citations.md](architecture/traceability-and-citations.md) — how answers stay grounded and auditable.
- [ai-providers.md](architecture/ai-providers.md) — provider integration today and the planned abstraction.
- [data-model.md](architecture/data-model.md) — database schemas and main entities.
- [decisions/](architecture/decisions/) — Architecture Decision Records (ADRs).

### [deployment/](deployment/) — self-hosting

- [installation.md](deployment/installation.md) — running Ágora on your own infrastructure.
- [configuration.md](deployment/configuration.md) — every environment variable, explained.
- [ai-provider-setup.md](deployment/ai-provider-setup.md) — configuring LLM and embedding providers.
- [security-and-privacy.md](deployment/security-and-privacy.md) — how data and secrets are protected.
- [cost-estimation.md](deployment/cost-estimation.md) — what running Ágora actually costs.

### [usage/](usage/) — end-user guides

- [getting-started.md](usage/getting-started.md) — from account creation to your first grounded answer.
- [uploading-knowledge.md](usage/uploading-knowledge.md) — supported sources and the processing lifecycle.
- [asking-questions.md](usage/asking-questions.md) — conversation modes, models, and citations.
- [organizing-projects.md](usage/organizing-projects.md) — organizations, projects, and multi-tenancy.

### [development/](development/) — for contributors

- [setup.md](development/setup.md) — local development environment.
- [coding-standards.md](development/coding-standards.md) — architecture contracts and conventions.
- [testing.md](development/testing.md) — testing strategy and how to run the suites.
- [extending-agora.md](development/extending-agora.md) — adding AI providers and other extension points.

### [roadmap.md](roadmap.md)

The phased plan from MVP to public open source launch.
