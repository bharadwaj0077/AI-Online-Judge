# AI-Powered Online Judge

An AI-powered Online Judge platform that supports multiple programming languages, automated evaluation, Docker-based sandboxing, AI-assisted learning, coding contests, and interview preparation.

## 🛠️ Tech Stack

* **Next.js** (Frontend Workspace Platform)
* **TypeScript** (Type-Safe Application Layer Framework)
* **Node.js & Express 5** (Backend REST Routing API Engine)
* **PostgreSQL 16+** (Relational Persistent Storage Model)
* **Prisma ORM 7.8.0** (Database Client & Migrations Processing Layer)
* **Docker** (Isolated Code Execution Micro-Sandboxes)
* **Redis & BullMQ** (Asynchronous High-Performance Job Processing Queues)
* **AWS S3** (Distributed High-Volume Object Storage Assets Engine)

## 📊 Status: Under Development

---

## 💾 Milestone 1: Core Relational Database Specification (Frozen V1)

The persistence engine is fully optimized for low-latency judge routing operations, tracking application states safely across **7 synchronized tables**.

### ⚡ Database Design Enhancements & Performance Optimizations
1. **Dual-ID Isolation Architecture:** All internal structural queries and relational database foreign key joins utilize auto-incremented `BIGINT` markers. External client-facing API paths selectively map to random `UUIDv4` hashes (`public_id`) to block malicious record enumeration.
2. **Production-Grade Soft Deletes:** To protect historic submission metadata, core records use a `deleted_at` timestamp rather than hard deletion. Advanced conditional partial unique indexes are bound natively in PostgreSQL to allow namespacing reuse once older records drop:
   * `CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;`
   * `CREATE UNIQUE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;`
   * `CREATE UNIQUE INDEX idx_problems_slug_active ON problems(slug) WHERE deleted_at IS NULL;`
3. **Compound High-Concurrency Query Indexing:** High-traffic lookups are bundled into composite indexes to protect database read channels under scale:
   * `TestCase (problem_id, order_no)`: Prevents random sorting overhead when loading evaluation arrays.
   * `Submission (user_id, problem_id)`:固定 Accelerates performance summary distributions across coding dashboards.
4. **Decoupled Language Compilation Matrix:** All compiler specifications, image environments, build keys, and runtime extensions are stored in an autonomous `languages` table. Onboarding new runtimes requires database inserts rather than code updates.

---

## 🔒 Milestone 2: Express Foundation & Secure Session Authentication

A layered backend architecture separating incoming network payloads, schema data parsing rules, cryptographic algorithms, and structural transaction commands.

### 🏗️ Backend Folder Topology
```text
backend/
├── src/
│   ├── config/          # Zod validation schemas and client pooling initializations
│   ├── controllers/     # Request stream mapping and cookie lifecycle distribution
│   ├── middlewares/     # Generic validation filters and centralized exception catches
│   ├── routes/          # REST route tree path configurations
│   ├── services/        # Atomic business execution logic and Prisma queries
│   ├── app.ts           # Middleware strapping core
│   └── server.ts        # Database pooling validation and network port listeners