# AGENTS.md — AI Agent Guidance & Repository Rules

This document provides mandatory guidance for autonomous AI coding agents (Antigravity, Claude Code, GitHub Copilot, Cursor, Windsurf, Devin) operating in `akazad13/system-design-tutorials`.

---

## 1. System Identity & Architecture

**Product**: `System Design Tutorials` — Interactive visual learning platform and handbook for distributed systems and high-availability architecture.
- **Runtime**: React 19, TypeScript, Vite 6.
- **Styling**: Tailwind CSS v4, Motion (`motion`), Lucide Icons.
- **Features**: 28+ interactive distributed systems case studies, animated request-flow traces, dynamic capacity estimators, and integrated Gemini AI advisor.
- **Deployment**: Vercel (`system-design-tutorials.vercel.app`).
- **Architectural Record**: Formal architecture decisions are recorded under [`docs/adr/`](docs/adr/README.md).

### Project Layout (`src/`):
- `src/components/`: Reusable visualization widgets (`ArchitectureCanvas.tsx`, `CapacityEstimator.tsx`, `CaseStudyDetail.tsx`, `DeepDiveViewer.tsx`, `FundamentalDetail.tsx`, `GlobalSearchModal.tsx`, `InterviewFrameworkModal.tsx`, `Navbar.tsx`, `Sidebar.tsx`).
- `src/data/`:
  - `case-studies-index.ts`: Master catalog of 28+ case studies across 6 categories.
  - `case-studies-*.ts`: Detailed topology nodes, request-flow steps, capacity metrics, and deep dives (ecommerce, infrastructure, messaging, social).
  - `fundamentals.ts`: Foundational distributed system topics (Load Balancing, Consistent Hashing, Distributed Caching, Sharding, Consensus).
- `src/types/`: Strict TypeScript contracts (`system-design.ts`) governing nodes, edges, request flows, and capacity formulas.
- `docs/adr/`: Architecture Decision Records index and historical decision log.

---

## 2. Inviolable Architectural Invariants

1. **Mathematical Accuracy of Estimators**:
   - Back-of-the-envelope calculation formulas must accurately account for read/write skew ratios, compression factors, replication factors, and 5-year data retention projections.
2. **Animation Performance**:
   - Request-flow animations must use CSS transitions or optimized canvas rendering without inducing frame drops on low-power devices.
3. **Decoupled Data Schema**:
   - Case study blueprints and architecture specs must live in `src/data/`. Do not embed case study text or graph topologies directly into rendering components.
4. **Architecture Decision Records (ADR) Compliance**:
   - Autonomous agents must adhere to recorded ADRs in [`docs/adr/`](docs/adr/README.md) ([ADR-0001](docs/adr/0001-record-architecture-decisions.md), [ADR-0002](docs/adr/0002-vite-react-system-design-platform.md)).
   - Any architectural change, new external dependency, or pattern pivot requires authoring a new ADR in `docs/adr/` with rationale, alternatives considered, and consequences.

---

## 3. Architecture Decision Records Reference

| ADR | Title | Key Invariant |
| :--- | :--- | :--- |
| [ADR-0001](docs/adr/0001-record-architecture-decisions.md) | Record Architecture Decisions | Standardized MADR format, sequential numbering, and centralized index in `docs/adr/README.md`. |
| [ADR-0002](docs/adr/0002-vite-react-system-design-platform.md) | Vite + React Architecture for System Design Platform | Client-side Vite 6 + React 19 SPA, custom lightweight SVG canvas, and strict separation between `src/data/` blueprints and `src/components/` visualizers. |
| [ADR-0003](docs/adr/0003-testing-paradigm-and-agentic-verification.md) | Testing Paradigm and Agentic Verification | Compile-time type verification (`tsc --noEmit`), blueprint data schema validation, and Vite build verification for sub-second agentic verification loops. |
| [ADR-0004](docs/adr/0004-reading-typography.md) | Reading Typography | Long-form text in `<main>` (`p`, `li`, `dd`) uses the reader's chosen font (Inter by default, Newsreader as serif) via `--reading-font`; use `font-mono` or a non-paragraph element for interface labels. |

---

## 4. Commands Cheat Sheet

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Sub-second compile-time type verification & schema check
npm run lint

# Run Vite production build verification
npm run build

# Preview build locally
npm run preview
```

---

## 5. Testing Paradigm & Agentic Verification

Autonomous agents must follow the fast, deterministic testing loop codified in [ADR-0003](docs/adr/0003-testing-paradigm-and-agentic-verification.md):

1. **Compile-Time Type & Schema Assertions (`npm run lint` / `tsc --noEmit`)**:
   - Every architectural blueprint in `src/data/` must strictly conform to `src/types/system-design.ts`.
   - TypeScript compile-time checking acts as our instantaneous unit and integration test suite (<1s execution).
   - Ensure `src/vite-env.d.ts` is preserved for Vite client type declarations.
2. **Build Verification (`npm run build` / `vite build`)**:
   - Verifies bundle integrity, dynamic import resolution, and Tailwind CSS v4 pipeline.
   - Must complete with **0 errors**.
3. **Core Verification Invariants**:
   - **Data Decoupling**: Keep case study topologies, flow steps, and calculations in `src/data/`. Do not hardcode blueprint details inside UI components.
   - **Zero Console Errors**: Ensure interactive components (calculators, SVG tracers, modals) run without unhandled runtime exceptions.
   - **Sub-Second Agentic Loop**: Always verify changes via `npm run lint` and `npm run build` prior to finishing tasks.

---

## 6. Verification Gates for AI Agents

Before submitting code changes or finishing a turn:
1. Run `npm run lint` (`tsc --noEmit`) — must exit with **0 type errors**.
2. Run `npm run build` (`vite build`) — must exit with **0 build errors**.
3. Verify that interactive calculators and animated tracers execute smoothly with zero console errors.
4. If introducing architectural shifts or major new dependencies, ensure a corresponding ADR is added in `docs/adr/` and indexed in `docs/adr/README.md`.
