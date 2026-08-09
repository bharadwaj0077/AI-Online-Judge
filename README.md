# AI-Powered Online Judge

An enterprise-grade, full-stack Competitive Programming and Interview Preparation platform engineered with a resilient multi-tier N-tier architecture. It provides secure Docker-based sandboxing, automated multi-language evaluation, AI-driven code mentorship via Google Gemini, real-time coding contests, role-based administration, and a LeetCode-grade interactive workspace.

---

## 🛠️ Tech Stack & System Architecture

| Layer | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router), Tailwind CSS | Server-side rendering (SSR), dynamic layout routing, and responsive UI components. |
| **Editor Workspace** | Monaco Editor, Custom Resizable Panes | In-browser syntax highlighting, multi-theme skinning, and multi-language support. |
| **Backend API** | Node.js, Express 5, TypeScript | RESTful route orchestration, middleware security pipelines, and request validation. |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM (7.8.0 / 7.9.1) | Relational persistence, connection pooling, and optimized data migrations. |
| **Sandboxing Engine** | Docker (Python, GCC, OpenJDK, Node.js) | Isolated OS micro-containers ensuring secure, resource-capped code execution. |
| **AI Mentorship** | Google GenAI SDK (`@google/genai`) | Automated code optimization review, hint generation, and complexity analysis. |
| **Cloud Infrastructure** | AWS RDS, AWS EC2 (`m7i-flex.large`), PM2 | Managed TLS-secured database cluster and 24/7 background application daemon host. |

---

## 🏛️ Comprehensive Milestone & Subsystem Breakdown

### Milestone 1: Core Relational Database Specification & Design Patterns
The persistence layer is optimized for high-throughput judge routing operations and strict data integrity across synchronized relational structures.

| Database Feature | Architectural Implementation & Benefit |
| :--- | :--- |
| **Dual-ID Isolation** | Internal queries and foreign key relationships utilize auto-incremented `BIGINT` markers, while external client APIs expose random `UUIDv4` hashes (`public_id`) to prevent malicious record enumeration. |
| **Production Soft Deletes** | Core records leverage a `deleted_at` timestamp coupled with conditional unique database indexes (e.g., `WHERE deleted_at IS NULL`) to safely preserve historical submission logs without violating uniqueness constraints. |
| **Compound Query Indexing** | High-concurrency query channels are optimized via composite indexes (e.g., `TestCase(problem_id, order_no)`) to eliminate sorting overhead during evaluation payload streaming. |
| **Decoupled Language Matrix** | All compiler configurations, Docker image tags, build flags, and file extensions are stored in an autonomous `languages` table, enabling new runtime integrations via database entries rather than source code redeployments. |

---

### Milestone 2: Express Foundation & Secure Session Authentication
A robust layered N-tier backend separating incoming network payloads, Zod data parsing rules, cryptographic verification, and transactional commands.

| Auth Endpoint | Method | Security & Functional Specification |
| :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Validates uniqueness constraints, hashes credentials using Bcrypt, and creates user records. |
| `/api/v1/auth/login` | `POST` | Issues a cryptographically signed JWT packed securely into an `HttpOnly` browser cookie to mitigate XSS vulnerabilities. |
| `/api/v1/auth/logout` | `POST` | Terminates active user sessions instantly by clearing authorization cookies. |
| `/api/v1/auth/me` | `GET` | Fetches active profile data for state restoration across client page refreshes. |

---

### Milestone 3: Problem Management Subsystem & Query Filtering
Handles programming challenges through an isolated multi-stage security and business validation pipeline.

| Subsystem Layer | Responsibilities & Operations |
| :--- | :--- |
| **Security Guard Middleware** | Operates as a double-blind firewall, extracting session tokens from cookies, verifying `JWT_SECRET` signatures, and attaching user roles to the request stream. |
| **Interface Controllers** | Validates incoming payloads using strict Zod schemas, parses route parameters, and packages outputs into uniform JSON envelopes. |
| **Business Logic Services** | Dynamically computes URL-safe slugs, handles title collision namespaces, and translates JavaScript variables to SQL primitives. |
| **Persistence Layer** | Executes optimized queries directly inside PostgreSQL via high-performance database client adapters. |

---

### Milestone 4: Nested Test Case Subsystem & Batch Ingestion
To maintain relational safety, test cases are modeled as nested sub-resources mapped directly to their parent problems.

| Endpoint / Action | Method | Implementation Details |
| :--- | :--- | :--- |
| `/api/v1/problems/:problemPublicId/test-cases/batch` | `POST` | Bulk-ingests a complete suite of test cases in a single atomic transaction (`prisma.$transaction`). |
| **Data Separation** | --- | Isolates public sample vectors (`isSample: true`) from hidden blind-test evaluation records (`isSample: false`). |

---

### Milestone 5: Secure Code Execution Sandbox Engine
Shifts the platform from a standard data-CRUD application into a secure remote execution environment capable of safely running untrusted code.

| Sandbox Protection Layer | Mechanism & Hard Limits |
| :--- | :--- |
| **Resource Isolation** | Each container execution is hard-capped at **256MB RAM**, **0.5 CPU slices**, and fully isolated with `--network none` to block external network access. |
| **Synchronous Termination** | Execution loops utilize blocking synchronous commands (`execSync`) paired with a `Promise.race` timeout wrapper to instantly issue a `docker kill` command on breach. |
| **Output Normalizer** | Strips carriage returns (`\r\n` vs `\n`) and trailing whitespace to eliminate multi-platform line-ending discrepancies between local builds and Linux containers. |
| **Verdict Matrix** | Classifies execution results into precise states: `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, and `RUNTIME_ERROR`. |

---

### Milestone 6: Persistent Submissions & Atomic Aggregations
Tracks user performance and metrics through non-blocking transactional write pipelines.

| Feature | Implementation Detail |
| :--- | :--- |
| **Dual-State Pipeline** | Submissions are initially saved under a `PENDING` status for immediate client feedback, then updated with final verdict metrics upon container completion. |
| **Anti-Exploit Aggregations** | Automatically updates user and problem submission tallies. If a submission receives an `ACCEPTED` verdict, the engine checks prior successful runs to prevent double-counting metrics. |

---

### Milestone 7: AI-Powered Code Analysis Engine (Gemini Integration)
Transforms the platform into an automated computer science mentor using Google’s modern production SDK (`@google/genai`).

| AI Engine Feature | Implementation Advantage |
| :--- | :--- |
| **On-Demand Processing** | Operates as a post-grading API call, keeping the core Docker sandboxing loop lightning fast. |
| **Anti-Double-Billing Cache** | Intercepts review requests for previously analyzed submissions, returning cached database rows without triggering redundant upstream API charges. |
| **Lazy Initialization** | Constructs the GenAI client only upon endpoint invocation, eliminating boot-time crash bugs caused by environment variable loading sequences. |
| **Data Normalization** | Translates raw JSON arrays returned by upstream models into structured markdown hint strings before writing to the `AiFeedback` table. |

---

### Milestone 8: Full-Stack Frontend Ecosystem & Monaco Workspace
An immersive developer interface built using Next.js App Router and professional UI components.

| Frontend Module | Features & Architecture |
| :--- | :--- |
| **Global Auth Context** | Manages browser state distribution, profile synchronization, and automated layout protection. |
| **Problem Directory & Filters** | Responsive data grid featuring live difficulty indicators (Emerald for Easy, Amber for Medium, Rose for Hard) and search sorting filters. |
| **Split-Screen IDE** | Integrates Monaco Editor with custom drag-handle resizable panes, multi-palette theme skinning (`synapse`, `midnight`, `cyberpunk`), and console I/O tabs. |

---

### Milestone 9: Role-Based Admin Panel & Edge Route Middleware
Secures administrative boundaries and workflow automation via edge-level request inspection.

| Protection Feature | Description |
| :--- | :--- |
| **Next.js Middleware** | Intercepts client navigation at the network edge, validating authentication tokens before rendering protected routes. |
| **Admin Control Center** | A dedicated `/admin` dashboard restricted via Role-Based Access Control (RBAC), granting administrators tools for user management, system auditing, and batch utility tasks. |

---

### Milestone 10: Real-Time Contests & Leaderboard Subsystem
Expands the environment into an active competitive arena.

| Competitive Component | Architecture Overview |
| :--- | :--- |
| **Contest Relational Model** | Manages live scheduling windows, weighted point allocations, and problem scoping via `Contest` and `ContestProblem` tables. |
| **Real-Time Scoreboards** | Automatically triggers score aggregates upon an `ACCEPTED` verdict, assigning difficulty-weighted point totals (10 pts Easy, 30 pts Medium, 50 pts Hard). |

---

### Milestone 11: Multi-Case Parallel Execution & Dynamic Templating
Optimizes the grading engine for dynamic challenge ingestion and concurrent batch evaluation.

| Feature | Implementation Detail |
| :--- | :--- |
| **Concurrent Batch Evaluation** | Replaces single-case sequential loops with a Promise-based batch processor executing all test cases simultaneously within isolated Docker instances. |
| **Dynamic Token Injection** | Replaces hardcoded problem slugs with runtime token parsing (`{{USER_CODE}}`, `{{INPUT}}`), injecting user code and inputs dynamically. |

---

### Milestone 12: Production Cloud Architecture (AWS Deployment)
Migrates the local development stack into an enterprise-ready cloud topology.

| Cloud Service | Production Configuration |
| :--- | :--- |
| **AWS RDS (PostgreSQL)** | Managed relational database cluster connected via secure TLS settings (`sslmode=require&uselibpqcompat=true`). |
| **AWS EC2 (Ubuntu 24.04 LTS)** | Provisioned on an `m7i-flex.large` instance equipped with NVMe storage and pre-pulled compiler Docker images. |
| **PM2 Process Manager** | Daemonizes the Node.js Express backend to run continuously 24/7 with automatic crash recovery configurations. |