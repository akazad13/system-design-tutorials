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

---

## 4. Commands Cheat Sheet

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run TypeScript checks & Vite production build
npm run build

# Preview build locally
npm run preview
```

---

## 5. Verification Gates for AI Agents

Before submitting code changes or finishing a turn:
1. Run `npm run build` — must compile with **0 errors**.
2. Verify that interactive calculators and animated tracers execute smoothly.
3. If introducing architectural shifts or major new dependencies, ensure a corresponding ADR is added in `docs/adr/` and indexed in `docs/adr/README.md`.
