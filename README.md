# KenkAI

> *Most people do not need more information. They need more clarity.*

KENKAI is an AI-powered strategic thinking platform that helps people gain clarity, make better decisions, and create actionable plans for life, career, and business. It is not a chatbot. It is not a productivity tool. It is a thinking partner — one that asks better questions than most humans will.

---

## Project Vision

We live in an age of infinite information and chronic indecision.

People scroll, consume, and overthink — yet most remain stuck at the same crossroads year after year. Not because they lack intelligence. Not because the answers do not exist. But because clarity is hard to find alone, and good strategic counsel has always been expensive, inaccessible, or slow.

KENKAI changes that.

We believe every person deserves access to the kind of rigorous, honest, strategic thinking that was once reserved for executives with consultants, or founders with mentors. The kind of thinking that challenges your assumptions, surfaces what you actually want, and forces you to reckon with the gap between where you are and where you intend to go.

KENKAI is that thinking partner — built for the long arc of a life, not a single session.

---

## Mission Statement

To give every person the clarity to act with intention — in their life, their career, and their business.

---

## Core Principles

**1. Clarity over information**
We do not surface more content. We surface what matters. Every feature is designed to reduce cognitive noise, not add to it.

**2. Questions before answers**
Great strategy begins with honest diagnosis. KENKAI asks hard questions first. Answers come after.

**3. Thinking frameworks, not templates**
We draw on First Principles, Second-Order Thinking, Inversion, and other battle-tested mental models. These are not decorations — they are the engine.

**4. Long-term over convenient**
KENKAI is designed for the person who wants to make a decision they will be proud of in ten years, not just satisfied with tomorrow. We optimize for that user.

**5. Earned trust through honesty**
We do not flatter. We do not optimize for engagement. We tell users what they need to hear, not what they want to hear.

---

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + TypeScript | UI and user experience |
| Build Tool | Vite | Fast development and optimized builds |
| Styling | Tailwind CSS 4 | Utility-first design system |
| Routing | Wouter | Lightweight client-side routing |
| Server State | TanStack Query | API data fetching and caching |
| Backend | Express.js v5 | REST API and SSE streaming layer |
| AI | Google Gemini | Strategic reasoning and conversation |
| Database | PostgreSQL + Drizzle ORM | Structured persistence |
| API Contract | OpenAPI 3.1 | Single source of truth for all interfaces |
| Code Generation | Orval | Auto-generated React Query hooks and Zod schemas |
| Logging | Pino | Structured, high-performance server logging |
| Package Manager | pnpm workspaces | Monorepo dependency management |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              React Frontend (Vite + TS)                 │   │
│   │                                                         │   │
│   │  Dashboard  │  Assessments  │  Sessions  │  Reports     │   │
│   │                                                         │   │
│   │            AI Chat (SSE Streaming)                      │   │
│   └────────────────────────┬────────────────────────────────┘   │
└────────────────────────────│────────────────────────────────────┘
                             │ HTTP / SSE
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS API SERVER                        │
│                                                                 │
│   /api/assessments    │  /api/sessions    │  /api/reports       │
│   /api/dashboard      │  /api/gemini      │  /api/healthz        │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 Gemini SSE Stream Handler                │   │
│   │         Real-time token streaming to client             │   │
│   └─────────────────────────────────────────────────────────┘   │
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐   ┌────────────────────────────────┐
│   PostgreSQL Database    │   │      Google Gemini API          │
│                          │   │                                 │
│  assessments             │   │  gemini-2.0-flash-preview       │
│  sessions + messages     │   │  KENKAI_SYSTEM_PROMPT           │
│  conversations           │   │  Strategic reasoning engine     │
│  gemini_messages         │   │                                 │
│  reports                 │   └────────────────────────────────┘
│  action_plans            │
└──────────────────────────┘
```

### Data Flow

1. **Client** makes typed API requests using auto-generated TanStack Query hooks (from Orval + OpenAPI)
2. **API Server** validates, routes, and processes requests via Express route modules
3. **Drizzle ORM** handles all database interaction with type-safe queries against PostgreSQL
4. **Gemini Integration** powers both structured session responses and real-time streaming AI chat via Server-Sent Events (SSE)
5. **OpenAPI spec** (`lib/api-spec/openapi.yaml`) is the single source of truth — any API change begins there and propagates to both server types and client hooks through codegen

---

## Project Structure

```
kenkai/
├── artifacts/
│   ├── kenkai/                    # React frontend application
│   │   └── src/
│   │       ├── components/        # Reusable UI components
│   │       ├── pages/             # Route-level page components
│   │       │   ├── dashboard.tsx
│   │       │   ├── assessments.tsx
│   │       │   ├── assessment-detail.tsx
│   │       │   ├── sessions.tsx
│   │       │   ├── session-detail.tsx
│   │       │   ├── reports.tsx
│   │       │   ├── report-detail.tsx
│   │       │   └── ai-chat.tsx
│   │       ├── hooks/             # Custom React hooks
│   │       └── lib/               # Utilities and helpers
│   │
│   └── api-server/                # Express.js backend
│       └── src/
│           ├── app.ts             # Middleware configuration
│           ├── index.ts           # Server entry point
│           └── routes/
│               ├── assessments.ts
│               ├── sessions.ts
│               ├── reports.ts
│               ├── dashboard.ts
│               ├── gemini.ts      # SSE streaming handler
│               └── health.ts
│
├── lib/
│   ├── api-spec/                  # OpenAPI 3.1 contract (source of truth)
│   │   └── openapi.yaml
│   ├── api-zod/                   # Generated Zod validation schemas
│   ├── api-client-react/          # Generated TanStack Query hooks
│   ├── db/                        # Drizzle ORM schema and migrations
│   ├── integrations/              # Shared integration utilities
│   └── integrations-gemini-ai/    # Gemini SDK wrapper
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kenkai.git
cd kenkai

# Install all workspace dependencies
pnpm install
```

### Database Setup

```bash
# Push the schema to your database
pnpm --filter @workspace/db run db:push

# Or run migrations
pnpm --filter @workspace/db run db:migrate
```

### API Code Generation

The client hooks and validation schemas are auto-generated from the OpenAPI spec. After any API contract change:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Development

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in a separate terminal)
pnpm --filter @workspace/kenkai run dev
```

---

## Environment Configuration

Create a `.env` file at the project root (or configure via your deployment platform):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kenkai

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=3001
NODE_ENV=development
```

Never commit `.env` files. Use environment secret management in production.

---

## API Design Philosophy

The API is designed around **contracts first**. Every endpoint is defined in `lib/api-spec/openapi.yaml` before a single line of implementation is written. This discipline ensures:

- **Frontend and backend stay in sync** — both consume the same generated types
- **No undocumented behavior** — if it is not in the spec, it does not exist
- **Type safety end-to-end** — from database to API response to React component, types flow without manual translation
- **Evolvability** — versioning and schema changes are visible, reviewable, and intentional

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Service health check |
| `GET` | `/api/dashboard` | Aggregated user metrics and activity |
| `GET` | `/api/assessments` | List all assessments |
| `POST` | `/api/assessments` | Create a new assessment |
| `GET` | `/api/assessments/:id` | Get assessment by ID |
| `GET` | `/api/sessions` | List all strategic sessions |
| `POST` | `/api/sessions` | Create a new session |
| `GET` | `/api/sessions/:id` | Get session with messages |
| `POST` | `/api/sessions/:id/messages` | Add message to session |
| `GET` | `/api/reports` | List all reports |
| `GET` | `/api/reports/:id` | Get full report with action plans |
| `POST` | `/api/gemini/chat` | AI chat (SSE streaming) |

### Streaming AI Responses

KENKAI uses **Server-Sent Events (SSE)** for the AI chat interface. When a message is sent to `/api/gemini/chat`, the server streams tokens in real-time as Gemini generates them. This creates a responsive, live-feeling interaction without the overhead of WebSocket infrastructure.

```
Client                    API Server              Gemini
  │                           │                      │
  │── POST /api/gemini/chat ──►│                      │
  │                           │── stream request ────►│
  │◄── SSE: token ────────────│◄── token ────────────│
  │◄── SSE: token ────────────│◄── token ────────────│
  │◄── SSE: [DONE] ───────────│◄── stream end ───────│
```

---

## Engineering Standards

### Code Quality
- TypeScript strict mode throughout — no `any`, no shortcuts
- All API types are generated, never hand-written
- Database queries are type-safe via Drizzle ORM
- Components are co-located with their logic

### Architecture Decisions
- **API-first**: OpenAPI spec is written before implementation
- **Codegen over duplication**: Types and hooks are generated, not copy-pasted
- **Thin routes, focused handlers**: Route files handle HTTP plumbing; business logic lives in focused modules
- **Structured logging**: Pino provides JSON-structured server logs suitable for any log aggregation platform

### Git Discipline
- Commits are small, focused, and descriptive
- Breaking API changes are coordinated with codegen regeneration
- Database schema changes are versioned as migrations, never ad-hoc

---

## Future Vision

KENKAI is version one of a much longer project.

**Near-term:**
- Multi-user accounts with persistent history and progress tracking
- Deeper assessment frameworks — not just what you want, but why you want it
- Report generation that produces exportable, shareable strategy documents

**Medium-term:**
- Longitudinal tracking — watch how your clarity evolves over months and years
- Proactive nudges — when your behavior diverges from your stated intentions, KENKAI notices
- Mobile-native experience for reflection on the go

**Long-term:**
- A platform where people return not just to plan, but to think
- AI that knows your history, your patterns, your blind spots — and respects that knowledge responsibly
- Strategic sessions with others: mentors, partners, teams

We are building something we expect to still be using in ten years. That shapes every decision we make today.

---

## Contributing Guidelines

KENKAI is a focused product with a strong point of view. Contributions should serve the core mission: helping people think more clearly and act with intention.

### Before contributing:
1. Understand the API contract flow — start with `lib/api-spec/openapi.yaml`
2. Run `pnpm install` and ensure the project builds cleanly
3. Re-run codegen after any API spec change: `pnpm --filter @workspace/api-spec run codegen`
4. Keep pull requests small and purposeful

### What we value in contributions:
- Clarity in naming — code that reads like it means something
- Respect for existing patterns — don't introduce a new pattern without a compelling reason
- Type safety — if you find yourself fighting TypeScript, stop and reconsider
- User impact — every change should make the product clearer, faster, or more honest

---

## Founder Note

I built KENKAI because I needed it.

Not as a hobby project. Not as a portfolio piece. As a genuine attempt to solve a problem I kept running into — in myself, in people I respect, in conversations with founders and professionals who were drowning in options but starving for direction.

The hardest decisions are rarely about information. They are about knowing what you actually want, being honest about where you actually are, and being willing to confront the distance between the two. Good strategic thinking does that. Most people never have access to it.

KENKAI is my attempt to change that.

If you are reading this ten years from now — whether you are a user, a contributor, or someone who found this in a late-night search — I hope the product has lived up to this intent. I hope it helped someone make a decision they are proud of. I hope it helped someone see themselves more clearly.

That was always the point.

---

*Built with intention. Designed for the long run.*
