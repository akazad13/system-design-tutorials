# ADR-0002: Vite + React Architecture for Interactive System Design Platform

## Status
Accepted

## Date
2026-11-07

## Context
The `System Design Tutorials` platform is an interactive, visual learning handbook designed to teach distributed systems, scalability patterns, and high-availability architectures through hands-on exploration.

Key functional requirements:
1. **Interactive Visualizations**: Render 28+ complex architectural blueprints with step-by-step request flow animations, node status indicators, latency hot-spot tracing, and component failure toggling.
2. **Back-of-the-Envelope Capacity Estimator**: Dynamic, reactive calculators for queries per second (QPS), read/write splits, network bandwidth, and multi-year storage requirements.
3. **Deep Educational Content**: Categorized case studies (Social & Content, Messaging, E-Commerce, Storage & Infrastructure, Search & Big Data, Financial), architectural comparison matrices, and interactive interview frameworks.
4. **Performance & Responsiveness**: 60 FPS request-tracing animations on desktop and mobile browsers, zero backend hosting dependency for core learning workflows, and instantaneous navigation.
5. **AI Architectural Advisor**: Contextual assistant powered by Google Gen AI SDK (`@google/genai`) to evaluate architectural trade-offs.

## Decision
We chose a high-performance, client-side Single Page Application (SPA) architecture built with:
- **Build Tool**: Vite 6 for instant Hot Module Replacement (HMR) and optimized tree-shaken static production bundles.
- **UI Framework**: React 19 with strict TypeScript for component-based visualizer state management and type safety.
- **Styling**: Tailwind CSS v4 and Motion (`motion` / Framer Motion) for hardware-accelerated animations and responsive layout design.
- **Architecture Visualization Engine**: Custom lightweight SVG and Tailwind-driven canvas (`src/components/ArchitectureCanvas.tsx`) using percentage-based coordinate mapping (`x`, `y` from 0-100%).
- **Strict Data Decoupling**: All system blueprints, node topologies, request flows, capacity metrics, and deep dives reside in strongly typed data modules under `src/data/` (typed via `src/types/system-design.ts`). Rendering components consume blueprints as pure props.

## Alternatives Considered

### Next.js / Server-Side Rendering (SSR)
- **Pros**: Built-in SSR, SEO optimization for content pages, API route handlers.
- **Cons**: Adds Node.js server runtime or edge worker complexity for what is fundamentally an interactive, client-side visual simulation and calculation tool. Cold starts on serverless functions degrade interactive responsiveness.
- **Rejected**: A static Vite SPA deploys trivially to global edge CDNs (Vercel, Cloudflare Pages, GitHub Pages) with zero runtime hosting costs, zero cold starts, and maximum client-side interactivity.

### Heavyweight Node-Graph Engines (e.g., React Flow, jsPlumb, Cytoscape)
- **Pros**: Pre-built drag-and-drop mechanics, edge routing algorithms, pan/zoom viewports.
- **Cons**: Substantial bundle overhead (>100KB gzipped), complex DOM/canvas reconciliation that impedes custom CSS animations, and rigid styling boundaries that clash with modern Tailwind styling.
- **Rejected**: A custom lightweight SVG coordinate canvas gives complete styling control over packet animations, custom node icons, protocol badges, and latency step highlights while keeping the bundle minimal.

### Raw HTML5 Canvas or WebGL
- **Pros**: Extreme rendering performance for tens of thousands of particles.
- **Cons**: Poor DOM accessibility, complex event handling, tedious text and icon rendering, and loss of responsive SVG vector scaling.
- **Rejected**: System design diagrams contain at most 10–25 nodes per diagram, where SVG + DOM transitions provide optimal fidelity, crisp vector graphics at any resolution, and standard accessibility.

## Consequences

### Positive
- **Instantaneous Interactions**: State changes in request-flow tracers and capacity inputs trigger immediate sub-frame re-renders without network round-trips.
- **Decoupled Architecture Data**: New case studies and system patterns can be added purely by creating data files under `src/data/` without modifying UI rendering logic.
- **Edge Deployment**: Static production assets deploy to global edge networks with near-zero latency worldwide.
- **Type Safety**: End-to-end TypeScript interfaces ensure all case studies provide valid node references, edge connections, and capacity formulas.

### Negative / Trade-offs
- **Initial Bundle Size**: Requires client-side JS bundle download on first visit (mitigated by Vite code-splitting and dynamic imports).
- **Client Dependency for AI Advisor**: Client-side execution of Gemini API calls requires managing API keys carefully via environment variables or optional backend proxies for production usage.
