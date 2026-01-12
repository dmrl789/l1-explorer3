# IPPAN L1 Explorer (DevNet)

A professional, investor-facing DevNet Explorer for **IPPAN L1**, showcasing the network's core innovations:

- **HashTimer™ ordering** - Deterministic transaction ordering
- **IPPAN Time** - Monotonic logical clock
- **Round finality** - Fast, provable finality with threshold signatures
- **Replay / auditability** - Complete state replayability from genesis

> **L1-only** — No token/L2 noise. Clean, boardroom-ready interface.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_IPPAN_API_BASE` | Yes | Primary IPPAN API base URL (e.g., `https://api1.ippan.uk`) |
| `NEXT_PUBLIC_IPPAN_API_FALLBACK` | No | Fallback API URL if primary fails |

Example `.env.local`:

```env
NEXT_PUBLIC_IPPAN_API_BASE=https://api1.ippan.uk
NEXT_PUBLIC_IPPAN_API_FALLBACK=https://api2.ippan.uk
```

## 📡 Expected API Endpoints

The explorer supports both `/v1/*` endpoints and legacy endpoints with automatic fallback:

### Status & Metrics
- `GET /v1/status` or `/status` - Network status, health, IPPAN Time
- `GET /v1/metrics/series?from=&to=&step=` or `/metrics` - Time series metrics

### Rounds
- `GET /v1/rounds?limit=&cursor=` or `/rounds` - List rounds
- `GET /v1/rounds/:id` or `/rounds/:id` - Round detail

### Blocks
- `GET /v1/blocks?limit=&cursor=` or `/blocks` - List blocks
- `GET /v1/blocks/:id` or `/blocks/:id` - Block detail

### Transactions
- `GET /v1/transactions?limit=&cursor=` or `/tx` - List transactions
- `GET /v1/transactions/:id` or `/tx/:id` - Transaction detail

### Search
- `GET /v1/search?q=` or `/search?q=` - Search across entities

### Audit / Replay
- `GET /v1/audit/replay` or `/audit/status` - Replay verification status
- `GET /v1/audit/checkpoints?limit=&cursor=` - State checkpoints

### Network
- `GET /v1/network/nodes` or `/nodes` - Network nodes list

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard - KPIs, TPS charts, finality metrics, proof panel |
| `/primitives` | IPPAN primitives explainer (HashTimer™, IPPAN Time, etc.) |
| `/rounds` | Rounds list with pagination |
| `/rounds/[id]` | Round detail with lifecycle, participants, proof |
| `/blocks` | Blocks list with pagination |
| `/blocks/[id]` | Block detail with parents, children, transactions |
| `/tx` | Transactions list with pagination |
| `/tx/[id]` | Transaction detail with lifecycle visualization |
| `/audit` | Audit/Replay status and state checkpoints |
| `/network` | Network nodes, validators, shadow verifiers |
| `/evidence` | DevNet evidence data room for due diligence |

## 🛠 Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** components
- **Recharts** for charts
- **SWR** for data fetching with caching
- **Zod** for runtime schema validation
- **Lucide React** for icons

## 🏗 Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── primitives/        # Primitives explainer
│   ├── rounds/            # Rounds list + detail
│   ├── blocks/            # Blocks list + detail
│   ├── tx/                # Transactions list + detail
│   ├── audit/             # Audit/Replay page
│   ├── network/           # Network nodes
│   └── evidence/          # DevNet evidence
├── components/            # Reusable UI components
│   ├── ui/                # shadcn/ui primitives
│   ├── top-nav.tsx        # Navigation
│   ├── kpi-card.tsx       # KPI display cards
│   ├── series-chart.tsx   # Recharts wrappers
│   ├── proof-panel.tsx    # Proof status display
│   └── ...
└── lib/
    ├── api.ts             # API client with fallback support
    ├── fetchJson.ts       # Fetch with timeout + error handling
    ├── schemas/           # Zod schemas for all data types
    └── hooks/             # SWR hooks for data fetching
```

## 🎨 Design Philosophy

- **Minimal clutter** - Clean, consistent typography and spacing
- **Skeleton loaders** - Never blank white screens
- **Graceful fallbacks** - Shows banners when endpoints are unavailable
- **Copy buttons** - Easy copying of hashes and IDs
- **Responsive** - Works on desktop and mobile

## 📊 Key Features

### Dashboard
- Network health indicator
- IPPAN Time with monotonic status
- Finality percentiles (p50/p95/p99)
- TPS (accepted vs finalized)
- Active validators + shadow verifiers
- Real-time charts

### Proof Panel
Shows at a glance:
- Deterministic ordering: ON/OFF
- HashTimer™ ordering: CANONICAL/PARTIAL
- Replay from genesis: PASS/FAIL/RUNNING

### Transaction Lifecycle
Visual timeline showing:
1. Ingress checked
2. HashTimer™ assigned
3. Included in block
4. Included in round
5. Finalized

With latency breakdown at each stage.

## 🚢 Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variable:
   - `NEXT_PUBLIC_IPPAN_API_BASE` = your API URL
3. Deploy

The app uses `output: 'standalone'` for optimal Vercel deployment.

## 📋 Demo Script Quick Links

For investor demos, use these pages in order:

1. **Dashboard** (`/`) - "Network is live, healthy, deterministic"
2. **Primitives** (`/primitives`) - "Here's what makes us different"
3. **Transaction Detail** (`/tx/[id]`) - "Watch the lifecycle"
4. **Audit/Replay** (`/audit`) - "Full auditability from genesis"
5. **DevNet Evidence** (`/evidence`) - "All the data for due diligence"

## 📝 License

MIT

---

Built for the IPPAN L1 DevNet • [ippan.uk](https://ippan.uk)
