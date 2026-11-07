# ADR-0001: Record Architecture Decisions

## Status
Accepted

## Date
2026-11-07

## Context
As the `system-design-tutorials` platform grows in scope—covering 28+ complex distributed system case studies, interactive canvas visualizations, capacity calculators, and AI advisor integrations—architectural choices and data contract designs need to be recorded transparently.

Without a structured decision record:
- Past architectural reasoning (e.g. why a client-side Vite SPA was chosen over an SSR framework, or how data schemas are decoupled from visualization components) is lost over time.
- Both human contributors and autonomous AI agents risk re-debating settled decisions or introducing conflicting architectural patterns.
- Onboarding new contributors or automated tooling requires oral tradition rather than authoritative documentation.

## Decision
We will use Architecture Decision Records (ADRs) to capture all significant architectural and technical decisions for this project.

1. **Storage Location**: ADRs are stored in `docs/adr/` as individual Markdown documents.
2. **Naming Convention**: `NNNN-short-descriptive-title.md` with zero-padded 4-digit sequential numbers (e.g., `0001-record-architecture-decisions.md`).
3. **Index**: A centralized `docs/adr/README.md` maintains a status table linking all ADRs.
4. **Lifecycle States**:
   - `Proposed`: Under active discussion or review.
   - `Accepted`: Approved and active invariant for the project.
   - `Superseded`: Replaced by a subsequent decision record (must cite superseding ADR).
   - `Deprecated`: Retired pattern no longer recommended.
5. **Format**: Each ADR captures Title, Status, Date, Context, Decision, Alternatives Considered (with Pros/Cons), and Consequences.

## Alternatives Considered

### External Wiki / Notion / Google Docs
- **Pros**: Easy collaborative real-time editing.
- **Cons**: Detached from git history, pull requests, and codebase versions. AI agents and automated review scripts cannot easily parse external docs during development.
- **Rejected**: Decisions must reside directly in the repository next to the code they govern.

### In-Code Comments or Generic Docs
- **Pros**: Zero initial setup.
- **Cons**: Scattered across various source files; fails to capture cross-cutting architectural rationale, trade-offs, and rejected options.
- **Rejected**: Does not provide a durable, central index of architectural intent.

## Consequences
- **Positive**:
  - Transparent technical history and clear rationale for architectural choices.
  - Autonomous AI agents and contributors have definitive invariants to adhere to.
  - Prevents regression into previously discarded architectures.
- **Negative / Trade-offs**:
  - Requires discipline to author an ADR when proposing or landing significant architectural pivots.
