# Architecture Decision Records (ADRs)

This directory documents the architectural and technical decisions made for the **System Design Tutorials** platform. Capturing these decisions provides transparent technical context, preserves institutional knowledge, and guides both human developers and autonomous AI agents.

See [ADR-0001: Record Architecture Decisions](0001-record-architecture-decisions.md) for background on our decision documentation process.

---

## Decision Log

| ADR | Title | Status | Date | Summary |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-0001](0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2026-11-07 | Establish ADRs as the standardized mechanism for documenting architectural invariants and technical decisions in `docs/adr/`. |
| [ADR-0002](0002-vite-react-system-design-platform.md) | Vite + React Architecture for Interactive System Design Platform | Accepted | 2026-11-07 | Adopt a client-side Vite 6 + React 19 + TypeScript + Tailwind CSS v4 architecture with custom SVG canvas and decoupled data schemas in `src/data/`. |
| [ADR-0003](0003-testing-paradigm-and-agentic-verification.md) | Testing Paradigm and Agentic Verification for Interactive Web Platform | Accepted | 2026-11-07 | Establish compile-time type verification (`tsc --noEmit`), blueprint data schema validation, and Vite build verification for sub-second agentic verification loops. |
| [ADR-0004](0004-reading-typography.md) | Use Inter for Long-Form Reading Text, with a Reader Serif Option | Accepted | 2026-11-08 | Inter (with disambiguated Il1 and 0/O) for paragraphs and lists in `<main>`, a saved Sans/Serif reader choice (Newsreader), 17px long-form text. |

---

## How to Propose a New ADR

1. Copy the structure of an existing ADR or follow the format:
   - **Title**: `# ADR-NNNN: [Short Imperative Title]`
   - **Status**: `Proposed | Accepted | Superseded by ADR-XXXX | Deprecated`
   - **Date**: `YYYY-MM-DD`
   - **Context**: Problem statement, background, business/technical drivers, constraints.
   - **Decision**: The selected architectural approach and implementation guidelines.
   - **Alternatives Considered**: Other options evaluated, including pros, cons, and reasons for rejection.
   - **Consequences**: Positive outcomes, operational trade-offs, and downstream impacts.
2. Place the new file in `docs/adr/` with zero-padded 4-digit numbering (`NNNN-title.md`).
3. Add a row to the table above in `docs/adr/README.md`.
4. Submit via pull request for review.
