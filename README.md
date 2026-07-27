<div align="center">

# OpsPilot AI Backend

### AI-assisted inventory operations for multi-tenant teams

OpsPilot turns stock movements into actionable workflows: it detects inventory risk,
creates reorder requests, delivers real-time alerts, and anchors critical audit events
to Hyperledger Fabric.

[![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Dockerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## Why this project exists

Inventory software is good at storing numbers, but operations teams still have to
notice risk, understand what changed, and decide what to do next. OpsPilot connects
that workflow end to end:

1. A warehouse operator records a stock movement.
2. The backend updates inventory transactionally and detects low-stock conditions.
3. Events trigger tenant-scoped notifications through WebSocket and Telegram.
4. The AI copilot can inspect live operational data and propose a reorder.
5. Write actions require explicit confirmation.
6. Audit events are hashed and asynchronously anchored to a permissioned blockchain.

This repository contains the NestJS API, the Python AI service, asynchronous workers,
and the local infrastructure needed to run the platform.

## System architecture

OpsPilot uses a modular monolith for the transactional business domain and separates
LLM orchestration into an independently deployable FastAPI service.

```mermaid
flowchart LR
    Client[Web / API client] -->|REST + JWT| API[NestJS API]
    Client <-->|Socket.IO| RT[Realtime gateway]

    API --> DB[(PostgreSQL)]
    API --> Cache[(Redis)]
    API --> MQ[(RabbitMQ)]
    API <-->|Internal tool API| AI[FastAPI AI service]
    AI --> LLM[Ollama / local LLM]

    MQ --> Workers[Event & audit workers]
    Cache --> Jobs[BullMQ jobs]
    Jobs --> Telegram[Telegram alerts]
    Workers --> Fabric[Hyperledger Fabric]
    API --> RT
```

### Key engineering decisions

- **Tenant context at the domain boundary** — JWT claims carry `companyId` and role
  information; tenant-aware repositories and guards scope operational access.
- **Safe AI actions** — read tools can query dashboards, stock risk, movements, and
  reorder data, while mutation tools execute only after a confirmed action.
- **Reliable asynchronous work** — RabbitMQ decouples domain events and blockchain
  anchoring; failed anchors use retry metadata and a dead-letter queue.
- **Fast reads without stale writes** — Redis caches dashboard-oriented queries while
  inventory mutations invalidate affected data.
- **Defense in depth** — Helmet, allow-listed CORS, DTO validation, password hashing,
  JWT authentication, role guards, API throttling, and a dedicated internal AI key.
- **Operational visibility** — dependency-aware health checks report PostgreSQL,
  Redis, and AI-service status independently.

## What is implemented

| Area | Capabilities |
| --- | --- |
| Identity & tenancy | Company signup, JWT authentication, tenant context, company user management, role-based authorization |
| Inventory | Warehouses, products, file attachments, inventory views, stock-in, stock-out, adjustments, and movement history |
| Reordering | Automatic low-stock detection, reorder requests, approval/rejection workflow, and audit trail |
| AI copilot | Persistent conversations, streaming responses, operational analytics tools, weekly reports, and confirmed reorder creation |
| Async processing | RabbitMQ topic events, BullMQ notification/report jobs, retries, scheduled risk monitoring, and weekly reports |
| Realtime & integrations | Tenant/user Socket.IO rooms, in-app notifications, Telegram delivery, and per-company integration settings |
| Audit integrity | Structured audit logs, SHA-256 payload anchoring, Hyperledger Fabric chaincode, verification endpoints, retries, and statistics |
| Platform | Swagger/OpenAPI, global validation and error handling, Redis caching, health checks, Docker images, and Nginx deployment configs |

## Technology

- **Core API:** Node.js 20, NestJS 11, TypeScript, TypeORM
- **Data:** PostgreSQL 16, Redis 7
- **Messaging:** RabbitMQ, BullMQ, NestJS Scheduler
- **AI:** Python 3.11, FastAPI, Ollama, tool-calling orchestration
- **Realtime:** Socket.IO / WebSocket
- **Audit ledger:** Hyperledger Fabric Gateway and JavaScript chaincode
- **API & security:** Swagger/OpenAPI, Passport JWT, bcrypt, Helmet,
  class-validator, rate limiting
- **Delivery:** Multi-stage Docker builds, Docker Compose, Nginx

## API surface

All application endpoints are served under `/api/v1` by default.

| Route group | Purpose |
| --- | --- |
| `/auth` | Signup, login, and authenticated profile |
| `/companies`, `/users` | Tenant and team administration |
| `/warehouses`, `/products`, `/files` | Inventory catalog management |
| `/inventory`, `/stock-movements` | Stock operations and history |
| `/reorder-requests` | Reorder review workflow |
| `/dashboard`, `/notifications` | Operational overview and alerts |
| `/ai-chat`, `/ai-copilot` | Conversation, streaming, and copilot endpoints |
| `/audit-logs`, `/blockchain` | Audit lookup, anchoring, and verification |
| `/system-health` | PostgreSQL, Redis, and AI dependency health |

Interactive OpenAPI documentation is available at
`http://localhost:4000/docs` in development.

## Run locally

### Prerequisites

- Node.js 20+
- npm
- Docker with Docker Compose

Python 3.11 and Ollama are needed only when running the AI service outside Docker.
Hyperledger Fabric is optional for core API development.

### 1. Install and configure

```bash
git clone https://github.com/bakha2209/opspilot-ai-backend.git
cd opspilot-ai-backend
npm install
cp .env.example .env
```

Replace placeholder secrets in `.env`. For a fresh **local-only** database, set
`DB_SYNCHRONIZE=true` for the first start, then return it to `false`. Also add the
RabbitMQ container credentials used by Compose:

```dotenv
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest123
RABBITMQ_URL=amqp://guest:guest123@localhost:5672
```

### 2. Start the core infrastructure

```bash
docker compose up -d postgres redis rabbitmq
npm run start:dev
```

The API starts at `http://localhost:4000`; RabbitMQ management is available at
`http://localhost:15672`.

### 3. Enable the AI copilot

```bash
cp ai-service/app/.env.example ai-service/app/.env
docker compose up -d ollama ollama-init ai-service
```

Then add or verify the matching values in the backend `.env`:

```dotenv
AI_SERVICE_URL=http://localhost:8008
AI_INTERNAL_API_KEY=dev-ai-internal-key
```

The first AI startup downloads the configured local model and can take several
minutes. The AI service is exposed on `http://localhost:8008`.

### 4. Optional demo dataset

The application seeder is idempotent. To create a sample company, warehouse,
products, and inventory on startup, add:

```dotenv
DEMO_SEED_ENABLED=true
DEMO_COMPANY_EMAIL=demo@opspilot.ai
DEMO_COMPANY_PASSWORD=change_this_password
```

## Hyperledger Fabric audit anchoring

Fabric is isolated from the core developer loop because it creates a permissioned
network, channel, chaincode, and organization credentials. The repository includes:

- two-organization network configuration;
- scripts for crypto and channel artifact generation;
- channel creation, peer joining, and anchor-peer updates;
- `audit-anchor` chaincode deployment;
- network verification and reset scripts.

On Linux, macOS, or WSL with the Fabric tools installed:

```bash
bash blockchain/scripts/setup-fabric-tools.sh
bash blockchain/scripts/generate-crypto.sh
bash blockchain/scripts/generate-channel-artifacts.sh
bash blockchain/scripts/start-fabric.sh
bash blockchain/scripts/create-channel.sh
bash blockchain/scripts/join-channel.sh
bash blockchain/scripts/update-anchor-peers.sh
bash blockchain/scripts/deploy-chaincode.sh
bash blockchain/scripts/verify-network.sh
```

After the external `opspilot-fabric-network` exists, the complete application stack
can be started with `docker compose up -d`.

## Development commands

```bash
npm run start:dev   # watch mode
npm run build       # production build
npm run start:prod  # run compiled output
npm run lint        # ESLint
npm test            # unit tests
npm run test:e2e    # end-to-end tests
npm run test:cov    # coverage
```

## Project structure

```text
.
├── src/
│   ├── modules/          # Business capabilities and API endpoints
│   ├── blockchain/       # Fabric gateway, publisher, worker, and verification
│   ├── libs/             # Database repositories, entities, seeders, security
│   ├── common/           # Guards, filters, enums, and response utilities
│   └── migrations/       # TypeORM migrations
├── ai-service/
│   └── app/              # FastAPI routes, prompts, tools, and LLM orchestration
├── blockchain/
│   ├── chaincode/        # Audit-anchor smart contract
│   ├── config/           # Fabric node and channel configuration
│   └── scripts/          # Reproducible network lifecycle scripts
├── deploy/nginx/         # Reverse-proxy configuration
├── test/                 # End-to-end tests
├── docker-compose.yml
└── Dockerfile
```

## Current status

The end-to-end product flow is implemented. The remaining work is production
hardening: expand meaningful automated coverage, run migrations in the deployment
pipeline, add CI quality gates, and add metrics/tracing for async workers.

## Author

Built by [Bakha](https://github.com/bakha2209) as a backend engineering portfolio
project focused on distributed workflows, applied AI, and operational reliability.

## License

This repository is currently unlicensed (`UNLICENSED` in `package.json`). All rights
are reserved unless a license is added.
