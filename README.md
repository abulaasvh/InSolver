# InSolver · AICTE Complaint Monitoring & Coordination Platform

> **Smart India Hackathon (SIH 2026) Prototype**  
> **Problem Statement ID:** `SIH26264`  
> **Domain:** Centralized Grievance Redressal, Multi-Bureau Coordination & Institutional Case Intelligence for AICTE

---

## 📌 Executive Overview

**InSolver** is a centralized intelligence and workflow platform designed for the **All India Council for Technical Education (AICTE)**. In higher education governance, complaints against technical institutions frequently arrive across fragmented intake channels and distinct bureaus (Approval Bureau, Policy Bureau, Anti-Ragging Cell, Women Cell, and Public Grievance Redressal Cell - PGRC). 

InSolver solves this fragmentation through:
1. **Canonical Institutional Identity**: Links complaints to unique AICTE Permanent IDs (`DEMO-1042`, etc.), preventing duplicate entities and ambiguous name variants.
2. **Intelligent Keyword & Hybrid Routing**: Automatically suggests the responsible bureau/cell with human-in-the-loop supervisor confirmation.
3. **Cross-Cell Overlap Detection**: Correlates related complaints filed across multiple bureaus against the same institution, calculating confidence scores without merging complaints automatically.
4. **SLA Deadline & Automated Escalation**: Flags "Due Soon" and "Overdue" status, triggering automated alerts and coordination notes.
5. **Tamper-Evident Append-Only Audit Trail**: Full regulatory accountability for every intake, routing confirmation, link review, status change, and export.
6. **Executive Analytics & Reporting**: Interactive visual dashboards and one-click filtered CSV exports.

---

## 🏗️ Architecture & Technology Stack

The project is structured as a production-ready TypeScript monorepo:

```
insolver/
├── apps/
│   ├── api/          # NestJS REST backend (Prisma, Passport JWT, Swagger, Class-Validator)
│   ├── web/          # React 18, Vite, Tailwind CSS, TanStack Query, Recharts, Lucide
│   └── worker/       # BullMQ & Redis background worker for async tasks & SLA checks
├── packages/
│   └── shared/       # Shared TypeScript types, interfaces, constants, and enums
├── docker/           # Docker database init scripts
├── docker-compose.yml# Multi-container orchestration (PostgreSQL 16, Redis 7, API, Web, Worker)
└── package.json      # NPM workspaces root
```

### Core Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, TanStack React Query v5, Recharts, Lucide Icons.
- **Backend**: NestJS 10, TypeScript, Prisma ORM 5, PostgreSQL 16 (Full-Text Search & pg_trgm), Passport JWT.
- **Queue & Async**: BullMQ, Redis 7, ioredis.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [npm](https://www.npmjs.com/) (v9+)
- [Docker & Docker Compose](https://www.docker.com/) (for PostgreSQL and Redis)

---

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/abulaasvh/InSolver.git
cd InSolver
npm install
```

---

### Step 2: Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://insolver:insolver_secret_password@localhost:5432/insolver_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=insolver_jwt_super_secret_key_sih2026
JWT_EXPIRATION=7d
VITE_API_URL=http://localhost:3000
```

---

### Step 3: Start Infrastructure Services (PostgreSQL & Redis)

Start the database and cache using Docker Compose:
```bash
docker compose up -d postgres redis
```

---

### Step 4: Run Migrations & Seed Synthetic Dataset

Generate the Prisma client and load the comprehensive synthetic test dataset:
```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma db push --schema=apps/api/prisma/schema.prisma
npm run seed
```

The database will be populated with:
- 5 AICTE Bureaus / Cells (`Approval Bureau`, `Policy Bureau`, `Anti-Ragging Cell`, `Women Cell`, `PGRC`)
- 6 Role-Based Test Users (Supervisor, Desk Officer, Management, Regional, Admin, Auditor)
- 9 Technical Institutions with Canonical AICTE Permanent IDs and aliases
- Realistic Complaints across different statuses (`New`, `Under Process`, `Overdue`, `Transferred`, `Disposed`)
- Pre-computed cross-cell overlaps (Confirmed, Suggested for live demo review, and Rejected)
- Audit log records and active SLA breach alerts

---

### Step 5: Start Development Servers

Run backend, frontend, and background worker concurrently or in separate terminals:

```bash
# Terminal 1: NestJS API (runs on port 3000)
npm run api

# Terminal 2: React Frontend (runs on port 5173)
npm run dev

# Terminal 3 (Optional): Worker
npm run worker
```

Open your browser and visit:  
👉 **http://localhost:5173**

---

## 👥 Demo Credentials & Test Roles

All demo accounts use the standard password: **`Demo@1234`**

| Role | Name | Email | Permissions & Focus |
| :--- | :--- | :--- | :--- |
| **Supervisor** *(Default)* | A. Rao | `a.rao@aicte.gov.in` | Intake triage, confirm routing suggestions, review cross-cell overlaps |
| **Desk Officer** | S. Iyer | `s.iyer@aicte.gov.in` | Cell case queue (PGRC), case detail updates, coordination notes |
| **Executive Management** | R. Sharma | `r.sharma@aicte.gov.in` | System-wide analytics, SLA compliance, cross-bureau monitoring |
| **Regional Officer** | V. Nair | `v.nair@aicte.gov.in` | South regional office oversight |
| **System Admin** | Admin | `admin@aicte.gov.in` | Rule configuration, overlap detection engine trigger |
| **Auditor** | Independent Auditor | `auditor@aicte.gov.in` | Read-only tamper-evident audit log inspection |

*(Note: The login page includes a quick 1-click test role switcher for effortless live demonstration!)*

---

## 🎯 Key Feature Walkthrough

### 1. Registering a Case & Routing Suggestions
- Navigate to **Cases** (`/cases`).
- Enter an AICTE ID (e.g. `DEMO-1042`), complaint subject, and region.
- The rule engine evaluates the subject keywords against routing rules (e.g., fee dispute -> PGRC, ragging -> Anti-Ragging Cell).
- Supervisors see an immediate **Routing Suggestion Card** to Confirm or Change the assigned cell.

### 2. Case Timeline & Coordination Notes
- Click any case (e.g. `CASE-0136`) to open **Case Details** (`/cases/:id`).
- View SLA status banners ("Due in 2 days" or "Overdue").
- Inline editable fields for Next Action, Deadline, and Lead Team coordination notes.
- Linked cases card displaying cross-bureau joint inquiries.
- Live append-only audit trail showing every update timestamp and actor.

### 3. Cross-Cell Overlap & Coordination
- Navigate to **Overlaps** (`/overlaps`).
- View multi-signal overlap detection cards with Confidence Bands (High/Medium/Low) and detection rationale (e.g., Same Institution ID, Close Dates, Active Concurrent Cases).
- Perform supervisor actions: **Confirm Joint Coordination**, **Reject Overlap** (with mandatory reason log), or **Defer**.
- Click **Run Detection Engine** to analyze newly registered cases.

### 4. Institution Profile & History
- Navigate to **Institutions** (`/institutions`) or enter an AICTE ID directly.
- View the unified historical timeline of all cases across all cells for that specific campus.
- Inspect aliases and active overlap relationships.

### 5. Bulk CSV Ingestion
- Click **Upload CSV** or visit `/import`.
- Upload a grievance export or click **Load Sample CSV** for instant demo.
- Validates rows, applies duplicate detection (idempotent matching), and imports cases into the system.

### 6. Compliance Analytics & Audit Export
- Navigate to **Reports** (`/reports`).
- Live Recharts visualizations: Bureau Distribution, Status Breakdown, Ageing Buckets (0-15, 16-30, 31-60, 60+ days), and Regional metrics.
- Click **Export Filtered CSV** to generate a regulatory compliance export with automatic audit logging.

---

## 🐳 Docker Production Deployment

To run the entire solution in containers:
```bash
docker compose up --build
```
The web application will be accessible on port `5173` (or `80`) and the API on port `3000`.

---

## 📄 License
Synthetic demonstration dataset created for Smart India Hackathon (SIH 2026).
