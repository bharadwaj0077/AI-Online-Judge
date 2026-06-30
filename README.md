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
```
## 🔐 Architectural Anatomy: Authentication Subsystem

We engineered a production-grade Layered (N-Tier) Architecture to handle user identity and session management. Every incoming network request to the auth boundary passes through structural validation, credential verification, and secure session issuance before touching the PostgreSQL database.

### Core Network Layer Baselines

- **Base URL Prefix:** `/api/v1`
- **Default Transportation Format:** `application/json`
- **Session Transport Layer:** Server-signed JWTs packed into stateful, secure `HttpOnly` cookies to isolate sessions from browser scripting memory vulnerabilities.

### Core Auth API

4 REST endpoints are exposed under the unified path prefix `/api/v1/auth` (plus a top-level health probe), covering account registration with Zod-validated, uniqueness-checked, Bcrypt-hashed credentials; login with JWT issuance into a secure cookie; and instant session termination on logout. Full endpoint details are documented in [`api.md`](./api.md).

### Testing Discipline

The automated Postman collection validates the auth subsystem across integration testing (Postman → Express Router → Zod Engine → Bcrypt → Database, and back) and boundary/edge-case testing: duplicate email and username collisions, malformed username patterns, short-password rejection, missing required keys, mismatched login credentials, unregistered usernames, and empty payload boundaries. All 12 test scenarios in the Auth suite currently pass at a 100% standard, with response envelopes, validation error layouts, and secure cookie headers all matching design patterns exactly.

## 🏗️ Architectural Anatomy: Problem Management Subsystem

We engineered a production-grade Layered (N-Tier) Architecture to handle programming challenges. Instead of writing messy, tightly-coupled code, the system forces every incoming network request to pass through an isolated multi-stage pipeline before it ever touches the PostgreSQL database.

### The 4 Tiers of the Problem Subsystem

- **The Security Guard Layer** (`auth.middleware.ts`): Operates as a double-blind firewall. It extracts the encrypted session token from incoming cookies, verifies its signature against `JWT_SECRET`, and attaches the user's role data directly to the request stream.
- **The Interface Controller Layer** (`problem.controller.ts`): The manager of the REST boundaries. It uses Zod schemas to structurally validate request data, parses route parameters (like raw URL slugs or client-facing UUIDs), and packages outgoings into uniform JSON envelopes.
- **The Core Business Engine Layer** (`problem.service.ts`): The brains of the operation. It calculates web-safe URL slugs on the fly, resolves unique namespace collisions if two problems share a title, and maps raw JavaScript variables to SQL primitives.
- **The Persistence Access Layer** (`schema.prisma`): Executes optimized reads, updates, and writes directly inside the PostgreSQL database via the high-performance Prisma 7 driver singleton.

### Core Problems API

5 REST endpoints are exposed under the unified path prefix `/api/v1/problems`, covering problem creation (admin-only), directory listing (role-aware visibility), individual lookup by slug, structural updates with automatic slug recalculation, and soft-delete archiving that preserves historical submission logs. Full endpoint details are documented in [`api.md`](./api.md).

### Testing Discipline

The automated Postman collection validates the subsystem across four testing disciplines: integration testing (full request pipeline, Postman → Express → Zod → Middleware → Service → Prisma → PostgreSQL), security and authorization matrix testing (anonymous request rejection, privilege escalation blocking), input validation boundary testing (empty payloads, out-of-range resource limits), and state/isolation regression testing (soft-deleted items correctly returning 404 on subsequent lookups). All 11 test scenarios in the Problems suite currently pass at a 100% standard.

## 🏛️ Architectural Anatomy: Test Case Subsystem (Nested Sub-Resources)

When building enterprise-grade REST APIs, handling data that completely depends on another entity requires a structural pattern called Nested Sub-Resources. Instead of creating a flat endpoint like `/api/v1/create-test-case`, test case routes are mounted directly onto the problem they belong to: /api/v1/problems/:problemPublicId/test-cases/batch

This design choice matters for two reasons:

- **Relational Safety:** It explicitly states that a test case cannot exist in a vacuum; it must belong to a specific parent challenge.
- **Router Encapsulation:** By using `Router({ mergeParams: true })` inside `testcase.routes.ts`, Express cleanly forwards the parent `:problemPublicId` variable down to the child controller, allowing separate route files to cleanly share URL keys.

### The 4 Layers Built

- **The Business Core** (`testcase.service.ts`): Handles ID translation (resolving the client-facing `publicId` UUID to the internal sequential `id` for fast relational operations), an overwrite-and-reset strategy (safely wiping previous test case rows via `deleteMany` before remapping new ones to avoid fragmented sequences), and atomic database transactions (`prisma.$transaction`) to guarantee all-or-nothing batch inserts.
- **The Interface Controller** (`testcase.controller.ts`): Enforces array structural validation via a `batchTestCaseSchema` that parses a nested array matrix (`z.array(singleTestCaseSchema)`), with safe threshold enforcement on data strings, sample flags, and integer score weights (`.int().min(1)`).
- **Dynamic Router Mounting** (`testcase.routes.ts` & `problem.routes.ts`): Test case routes are cleanly injected into the bottom of `problem.routes.ts` via `router.use("/:problemPublicId/test-cases", testCaseRoutes)`, keeping the routing tree legible as the project expands.
- **The Persistence Layer**: Stores evaluation data with explicit input format delimiters, public/hidden visibility flags, and automatically calculated execution order.

### Core Test Case API

A bulk-ingestion endpoint is exposed under `/api/v1/problems/:problemPublicId/test-cases/batch`, allowing admins to upload an entire test suite for a problem in a single atomic transaction. Full endpoint details are documented in [`api.md`](./api.md).

### Data Integrity Verified

Bulk-loaded payloads are correctly structured into inline system delimiters (input strings with explicit line breaks for simulating terminal stdin), dynamic flag assertions (separating public `isSample: true` examples from hidden `isSample: false` evaluation vectors used to blind-test against cheating), and automatic sequence order arrays (`orderNo` calculated from array index) to guarantee deterministic test execution order in future sandboxed runners.