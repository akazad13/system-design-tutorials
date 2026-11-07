# ADR-0003: Testing Paradigm and Agentic Verification for Interactive Web Platform

## Status
Accepted

## Date
2026-11-07

## Context
The `System Design Tutorials` platform is an interactive, visual learning handbook containing 28+ distributed systems case studies, dynamic capacity calculation estimators, animated SVG request-flow visualizers, and an integrated Gemini AI advisor.

As autonomous AI agents (Antigravity, Claude Code, Cursor, Copilot) and human contributors actively extend the platform with new architectural blueprints, case studies, and UI components, maintaining platform integrity requires a clear, rigorous testing paradigm.

Key challenges and constraints:
1. **Blueprint Data Integrity**: 28+ case studies comprise hundreds of topology nodes, directed edges, multi-step request flows, capacity calculation metrics, and database schemas. Any malformed property, broken node reference, invalid protocol, or coordinate out of range breaks the interactive canvas.
2. **Mathematical Accuracy**: Capacity estimators (QPS, storage, bandwidth, read/write ratios) must remain mathematically sound across all system designs.
3. **Sub-Second Agentic Feedback Loop**: Autonomous AI agents operate most effectively with rapid, deterministic verification feedback (<2 seconds). Long-running or flaky test suites degrade agent velocity and reliability.
4. **Zero-Error Production Deployments**: Static edge deployment (Vercel) requires clean, error-free bundling with zero runtime console exceptions.

## Decision
We establish a multi-tier **Interactive Web Testing Paradigm & Agentic Verification Strategy** grounded in compile-time schema validation, static type contracts, and production build verification:

### 1. Compile-Time Type Verification & Blueprint Schema Assertions (`tsc --noEmit`)
- **Strict Data Contracts**: All architectural blueprints, node topologies, request flows, and capacity formulas must strictly implement the TypeScript interfaces defined in `src/types/system-design.ts` (`CaseStudy`, `ArchitectureNode`, `ArchitectureEdge`, `RequestFlowStep`, `CapacityEstimation`, `DatabaseSchema`, etc.).
- **Schema Assertions as Unit Tests**: By enforcing strict typing across all data modules in `src/data/`, the TypeScript compiler (`tsc --noEmit`, via `npm run lint`) functions as an instantaneous, sub-second test suite. Schema violations, missing required fields, or invalid enum values fail immediately at compile time.
- **Environment & Module Declarations**: Standardized environment declarations (`src/vite-env.d.ts`) guarantee side-effect asset imports (CSS, static media) and Vite client types are statically validated without compilation ambiguities.

### 2. Bundler & Production Build Verification (`vite build`)
- **Bundle Integrity**: `npm run build` executes `vite build`, verifying:
  - Complete module resolution and dynamic import tree validity.
  - Tailwind CSS v4 styling compilation and syntax validity.
  - Zero JSX/TSX syntax regressions or unresolvable imports.
  - Production asset minification and tree-shaking under strict budget limits.
- **Gating Function**: A clean exit (code 0) from `vite build` is the mandatory verification gate before any commit or deployment.

### 3. Core Architectural Testing Invariants
All agentic and human changes must preserve three inviolable invariants:
1. **Strict Data Decoupling**: Architectural blueprints and case studies must live exclusively in `src/data/` as strongly typed structures. Rendering components (`src/components/`) must remain pure visualizers accepting props, with zero hardcoded system topologies.
2. **Zero Runtime Errors**: The interactive canvas, capacity estimators, and modal drawers must execute with zero unhandled exceptions or console errors during user interactions.
3. **Sub-Second Verification Velocity**: Verification checks must run in under 2 seconds locally, enabling rapid red-green-refactor iteration for AI agents.

## Alternatives Considered

### Heavyweight End-to-End Test Frameworks (e.g., Playwright, Cypress)
- **Pros**: Tests real browser rendering, click events, and packet animation timing in headless browsers.
- **Cons**: Adds substantial dependencies (>150MB), requires headless browser binaries, introduces flaky timing races on CSS/SVG animations, and stretches verification time from ~1s to >60s.
- **Rejected**: Compile-time schema enforcement combined with `vite build` verification provides high confidence without heavy test runner overhead. Interactive UI testing is handled through targeted browser DevTools MCP inspection when needed.

### Runtime Schema Validation (e.g., Zod, Valibot)
- **Pros**: Validates data at runtime with custom error reporting.
- **Cons**: Adds runtime bundle overhead to client-side bundles and duplicates TypeScript interface definitions for static, checked-in data files that never come from untrusted external APIs.
- **Rejected**: Since blueprint data is statically compiled into the SPA bundle, compile-time TypeScript checks provide 100% type safety with zero runtime bundle tax.

## Consequences

### Positive
- **Instantaneous Feedback**: Agents and developers run `npm run lint` and `npm run build` in ~1.5 seconds combined, ensuring immediate verification of every code modification.
- **Total Schema Coverage**: Every node, edge, flow step, and capacity metric in `src/data/` is statically validated against `src/types/system-design.ts`.
- **Rock-Solid Deployments**: Guaranteed zero-error builds before pushing to Vercel edge infrastructure.
- **Standardized Agent Playbook**: Provides unambiguous, enforceable verification criteria in `AGENTS.md`.

### Negative / Trade-offs
- **Subjective Visual Pacing**: Animation speed and visual aesthetics cannot be verified solely through static types and require occasional DevTools or visual spot-checks.
- **Strict Typing Discipline**: Adding new blueprint fields requires updating the central types in `src/types/system-design.ts`, ensuring consistency across all case studies.
