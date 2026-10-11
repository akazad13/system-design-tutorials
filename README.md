# 🏛️ System Design Handbook & Interactive Case Studies

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=flat&logo=vercel)](https://system-design-tutorials.vercel.app)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An interactive, visual learning platform and handbook for mastering **System Design**, **Distributed Systems**, and **High-Scalability Architectural Patterns**. Features 28+ real-world interactive architectural case studies with animated request flow visualizers, bottleneck analyzers, and capacity estimators.

🔗 **Live Application**: [https://system-design-tutorials.vercel.app](https://system-design-tutorials.vercel.app)

---

## 🌟 Key Features

- **📚 Core Building Blocks**: Deep dives into Load Balancing, Consistent Hashing, Distributed Caching (Redis/Memcached), Message Queues (Kafka/RabbitMQ), Database Sharding & Replication, and Consensus (Raft/Paxos).
- **🔬 28+ Real-World Case Studies**: Interactive architectures modeled for URL Shorteners (Bitly), Rate Limiters, Distributed Cache, Real-time Chat (WhatsApp/Slack), Video Streaming (YouTube/Netflix), E-Commerce Checkout, and Notification Services.
- **⚡ Interactive Flow Visualizers**: Step-by-step visual request tracing showing client-to-edge, edge-to-service, cache-hit/miss flows, and database writes.
- **🧮 Back-of-the-Envelope Capacity Estimator**: Dynamic calculators for QPS, bandwidth, read/write ratios, and storage growth over 5 years.
- **🤖 AI Architectural Advisor**: Built-in Gemini AI integration for architectural trade-off evaluations and design Q&A.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [@google/genai SDK](https://github.com/google-gemini/gemini-api)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

`ash
# Clone the repository
git clone https://github.com/akazad13/system-design-tutorials.git
cd system-design-tutorials

# Install dependencies
npm install

# Start development server
npm run dev
`

Visit http://localhost:3000 in your browser.

### Build for Production

`ash
npm run build
npm run preview
`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.