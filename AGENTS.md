# AGENTS.md — AI Agent Guidance & Repository Rules

This document provides mandatory guidance for autonomous AI coding agents (Antigravity, Claude Code, GitHub Copilot, Cursor, Windsurf, Devin) operating in `akazad13/system-design-tutorials`.

---

## 1. System Identity & Architecture

**Product**: `System Design Tutorials` — Interactive visual learning platform and handbook for distributed systems and high-availability architecture.
- **Runtime**: React 19, TypeScript, Vite 6.
- **Styling**: Tailwind CSS v4.
- **Features**: 28+ interactive distributed systems case studies, animated request-flow traces, dynamic capacity estimators, and integrated Gemini AI advisor.
- **Deployment**: Vercel (`system-design-tutorials.vercel.app`).

### Project Layout (`src/`):
- `src/components/`: Reusable visualization widgets, animated request-flow tracers, latency analyzers, navigation bar.
- `src/data/`:
  - `topics.ts`: Comprehensive case studies (URL shortener, Rate limiter, Distributed cache, Chat system, Video streaming).
  - `calculators.ts`: Mathematical back-of-the-envelope capacity estimation formulas (QPS, IOPS, storage, bandwidth).
- `src/pages/`: Route views, topic detail visualizers, architectural comparison matrices.

---

## 2. Inviolable Architectural Invariants

1. **Mathematical Accuracy of Estimators**:
   - Back-of-the-envelope calculation formulas must accurately account for read/write skew ratios, compression factors, replication factors, and 5-year data retention projections.
2. **Animation Performance**:
   - Request-flow animations must use CSS transitions or optimized canvas rendering without inducing frame drops on low-power devices.
3. **Decoupled Data Schema**:
   - Case study blueprints and architecture specs must live in `src/data/`. Do not embed case study text directly into rendering components.

---

## 3. Commands Cheat Sheet

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

## 4. Verification Gates for AI Agents

Before submitting code changes or finishing a turn:
1. Run `npm run build` — must compile with **0 errors**.
2. Verify that interactive calculators and animated tracers execute smoothly.
