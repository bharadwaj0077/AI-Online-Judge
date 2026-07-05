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

4 REST endpoints are exposed under the unified path prefix `/api/v1/auth` (plus a top-level health probe), covering account registration with Zod-validated, uniqueness-checked, Bcrypt-hashed credentials; login with JWT issuance into a secure cookie; and instant session termination on logout. Full endpoint details are documented in [`api.md`](/docs/api.md).

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

5 REST endpoints are exposed under the unified path prefix `/api/v1/problems`, covering problem creation (admin-only), directory listing (role-aware visibility), individual lookup by slug, structural updates with automatic slug recalculation, and soft-delete archiving that preserves historical submission logs. Full endpoint details are documented in [`api.md`](/docs/api.md).

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

A bulk-ingestion endpoint is exposed under `/api/v1/problems/:problemPublicId/test-cases/batch`, allowing admins to upload an entire test suite for a problem in a single atomic transaction. Full endpoint details are documented in [`api.md`](/docs/api.md).

### Data Integrity Verified

Bulk-loaded payloads are correctly structured into inline system delimiters (input strings with explicit line breaks for simulating terminal stdin), dynamic flag assertions (separating public `isSample: true` examples from hidden `isSample: false` evaluation vectors used to blind-test against cheating), and automatic sequence order arrays (`orderNo` calculated from array index) to guarantee deterministic test execution order in future sandboxed runners.

## 🔒 Architectural Anatomy: Secure Code Execution Subsystem (Sandbox Engine)

The most significant technical threshold in building an Online Judge is shifting from a standard web application that moves data to and from a database into an isolated remote code execution engine. Executing user-submitted code directly on the host OS exposes three critical attack vectors: filesystem destruction via system calls, CPU resource hijacking through infinite loops, and data leakage via outbound network connections. To eliminate all three, we built a secure micro-sandbox execution workflow using Docker.

### The 5 Layers Built

- **Global Execution Config** (`compiler.config.ts`): Centralizes all sandbox hardware limitation constants — each execution is hard-capped at 256MB RAM, 0.5 CPU core slices, and fully isolated with `--network none` to prevent any inbound or outbound network access from untrusted code.
- **The OS-Level Sandbox Broker** (`sandbox.service.ts`): Creates a unique temporary `executionId` directory per submission to prevent race condition overwrites when simultaneous submissions arrive, wraps every Docker execution inside a `Promise.race()` to enforce time limits and fire a `TIME_LIMIT_EXCEEDED` verdict on breach, and always drops into a `finally` block to garbage-collect the temporary execution folder regardless of outcome.
- **The Output Normalizer** (`compare.ts`): Houses the `OutputMatcher` utility which strips trailing whitespace, carriage returns (`\r\n` vs `\n`), and empty lines before running semantic equality comparisons, fixing a critical multi-platform line-ending mismatch bug between Windows-compiled outputs and Linux Docker container outputs.
- **The Evaluation Orchestrator** (`judge.service.ts`): Bridges database records with the low-level sandbox. Pulls a problem's test cases from PostgreSQL, loops through them sequentially, invokes `SandboxService` per case, scores outputs via `OutputMatcher`, tracks peak execution times, and short-circuits evaluation immediately on the first failure to avoid wasting CPU resources on remaining test cases.
- **The HTTP Judge Entry Point** (`judge.routes.ts` & `app.ts`): Exposes an isolated testing channel at `POST /api/v1/judge/evaluate/:problemPublicId` to verify Docker configurations, text normalization, and timeout racing before tying the engine to permanent user submission history.

### Verdict System

| Verdict | Trigger Condition | Responsible Component |
|---|---|---|
| `ACCEPTED` | Code runs within time limit, exits cleanly, output matches expected | `OutputMatcher` & `JudgeService` |
| `WRONG_ANSWER` | Code runs and exits cleanly, but output does not match expected | `OutputMatcher` |
| `TIME_LIMIT_EXCEEDED` | Execution exceeds the problem's allotted time limit | `SandboxService` (`Promise.race`) |
| `RUNTIME_ERROR` | Code contains syntax errors, throws unhandled exceptions, or exits with a non-zero code | `SandboxService` (stderr interceptor) |

## 🧩 Milestone 4 & 5: Sandboxed Execution Guardrails & Persistent Submissions

Successfully engineered the core secure compilation engine, optimized execution pipelines against multi-case resource drains, and wired an atomic database logging matrix to track persistent user submissions.

### 🐋 Advanced Sandbox Guardrails & Ghost Container Mitigation
* **Synchronous Process Termination (`execSync`):** Upgraded the time-limit execution handler from asynchronous callbacks to a blocking, synchronous OS-level signal loop. This ensures that the exact millisecond a submission hits its `timeLimitMs` window, a hard `docker kill <executionId>` command runs, instantly freeing up host system memory and releasing directory file locks.
* **Isolate Concurrent Spaces:** Enforced a dynamic multi-tenant file separation schema using unique runtime `executionId` names. This guarantees that multiple parallel code evaluations happen in complete isolation without overwriting local source binaries.

### 🚀 High-Performance Grading Loop Optimization
* **Test Case Short-Circuiting:** Re-engineered the sequential verification loop inside the grading manager to halt execution immediately upon encountering *any* failed case (`WRONG_ANSWER`, `RUNTIME_ERROR`, or `TIME_LIMIT_EXCEEDED`). This stops the engine from launching unnecessary subsequent Docker sandboxes, significantly reducing system CPU overhead.
* **String Output Normalization:** Introduced a robust edge-case text cleaner that handles platform variations (converting Windows `\r\n` to Linux `\n`) and strips extraneous whitespace, ensuring submissions are graded strictly on logical accuracy.

### 📊 Stateful Submissions & Atomic Aggregation Counters
* **Dual-State Transaction Pipeline:** Implemented an optimized non-blocking database write sequence. Submissions are instantly saved to PostgreSQL under a `PENDING` tracking state to ensure fast client feedback before being updated with the final verdict, duration metrics, and score arrays.
* **Anti-Exploit Aggregations:** Constructed transactional Prisma operations that increment global submission tallies for both users and problems. If a submission receives an `ACCEPTED` verdict, the engine checks for prior successful runs to adjust the user's `problemsSolved` metric accurately without double-counting vulnerabilities.

## 🤖 Architectural Anatomy: AI-Powered Code Analysis Engine (Phase 6)

The platform's crown jewel feature transforms the Online Judge from a grading tool into an automated computer science mentor. Users can request an on-demand AI review of any previous submission, receiving algorithmic optimization analysis, edge-case feedback, complexity metrics, and progressive hints — without spoiling direct answers.

### Core Features

- **On-Demand AI Mode:** AI review runs as an isolated, post-grading API invocation, keeping the core Docker sandboxing loop under 1 second. Users explicitly trigger reviews on previous submissions, ensuring contest integrity and strict API token budget control.
- **Intelligent Analysis:** Google's Gemini model evaluates the submitted source code against the parent problem statement, calculating runtime complexity, flagging structural edge-case oversights, and generating descriptive mentorship feedback.
- **Anti-Double-Billing Cache:** If a submission has already been reviewed, the controller intercepts the request and instantly returns the cached result from PostgreSQL — no duplicate upstream API charges.

### Engineering Obstacles Solved

- **Dependency Constructor Mismatch:** Migrated from the deprecated `@google/generative-ai` package (which caused fatal `TypeError: not a constructor` crashes) to Google's modern unified production SDK `@google/genai`.
- **ES Module Hoisting Bug:** JavaScript hoisted `import app` above `dotenv.config()`, causing the AI client to initialize before `.env` was read — passing `undefined` API keys and triggering 13-second connection timeouts. Fixed via **Lazy Initialization** inside `ai.service.ts`, building the `GoogleGenAI()` client only at the moment a user hits the endpoint.
- **Upstream 503 Congestion:** Free-tier `gemini-2.5-flash` traffic spikes caused `UNAVAILABLE` exceptions. Fixed with a fast fallback lane routing to the stable `gemini-1.5-flash` engine.
- **Prisma Type Mismatch:** Gemini returned hints as a JSON array but PostgreSQL expected a flat `String`. Fixed with an inline Data Normalization Gateway that maps arrays into numbered markdown strings before the Prisma write.

### Database Evolution

A dedicated `AiFeedback` table was introduced in `schema.prisma`, decoupled from the core `submissions` table to keep fast historical queries unaffected by large markdown text blocks. A `CASCADE` delete constraint ensures AI feedback rows are automatically wiped when their parent submission is deleted, preventing orphaned database records.

### Core AI API

2 REST endpoints are exposed under `/api/v1/ai`:

- `POST /review/:submissionPublicId` — Triggers an AI review for a specific submission. Returns cached data if already analyzed.
- `GET /review/:submissionPublicId` — Fetches the stored AI feedback for a previously analyzed submission.

Full endpoint details are documented in [`api.md`](./docs/api.md).

### Verified Output

A clean `201 Created` response confirms the full pipeline is operational:

```json
{
  "verdict": "ACCEPTED",
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(N)",
  "hints": "1. Review alternative input parsing structures.\n2. Consider nested loop resource footprint.\n3. Think about empty input edge cases."
}
```

## 🎨 Architectural Anatomy: Full-Stack Frontend Ecosystem (Phase 7)

The platform has successfully transitioned from a pure backend utility into a highly interactive, full-stack ecosystem built on Next.js 16 (App Router). The frontend delivers a LeetCode-grade interactive experience with server-side rendering, cross-origin secure cookie handling, and an embedded Monaco IDE workspace.

### Core Structural Additions

- **Axios HTTP Interface** (`src/lib/api.ts`): A unified network connection instance built with `withCredentials: true`, forcing the browser to securely pass `HttpOnly` authorization cookies across all cross-origin requests. The interceptor is refactored to silently pass `401` and `404` background status errors down the promise chain without crashing the UI.
- **Global Auth Context** (`src/context/AuthContext.tsx`): A state distribution hub that checks login status on page load, mounts profile data down the layout tree, handles structural page protection, and manages clean logouts.

### Interactive Dashboard Ecosystem

- **Community Hub** (`src/app/page.tsx`): A three-column developer dashboard with real-time contest countdown tickers, community technical update streams, and quick-access learning track widgets.
- **Problem Directory** (`src/app/problems/page.tsx`): A responsive data grid reading problems from PostgreSQL with custom color-coded difficulty indicators — Emerald for Easy, Amber for Medium, Rose for Hard.
- **Split-Screen IDE Workspace** (`src/app/problems/[slug]/page.tsx`): A professional split-screen IDE embedding the VS Code Monaco Editor with language selection, test-case console I/O, real-time submission triggers, and an on-demand AI review drawer displaying Gemini feedback with live time/space complexity meters.

### Engineering Obstacles Solved

- **Next.js Background 404 Crash Overlay:** The missing `getMe` endpoint caused Axios to throw a `404`, which Next.js interpreted as a fatal layout panic and locked the screen with a red dev overlay. Fixed by building the `getMe` endpoint in `auth.controller.ts` and refactoring the Axios interceptor to silently handle background auth checks.
- **Dual-Identifier Login (Email or Username):** Initial backend rewrites caused duplicate variable declarations crashing the compiler, and a `400 Bad Request` mismatch because the Zod schema expected `identifier` while the client sent `username`. Fixed by rewriting `auth.controller.ts` from scratch with a unified `identifier` key mapped cleanly to the `AuthService`.
- **Cookie Domain Mismatch Loop:** Users logged in successfully but were immediately bounced back to the login screen due to the browser dropping cookies over `127.0.0.1` vs `localhost` domain mismatches. Fixed by aligning `NEXT_PUBLIC_API_URL` to `localhost:5000` and updating the backend CORS policy in `app.ts` to explicitly trust `http://localhost:3000`.
- **React BigInt Key Warning:** PostgreSQL `BigInt` IDs lose formatting predictability in React's virtual DOM mapping. Fixed with a bulletproof fallback key: `problem.id?.toString() || problem.publicId`.

## 🚀 Recent Changelog & System Architecture Milestone

The platform has successfully evolved from a static problem directory layout into a highly collaborative, **Real-Time Full-Stack Competitive Programming Platform**. Below is an overview of the microservices, systems, and engineering bugs resolved during this sprint.

### ⚡ 1. Live Timed Contest Subsystem & WebSockets
* **Relational Database Topology Expansion:** Expanded our Prisma PostgreSQL tracking boundaries with `Contest` and `ContestProblem` structural models to manage live schedules, weighted points, and solution constraints safely.
* **Socket.io State Orchestrator (`backend/src/config/socket.ts`):** Implemented a real-time event pipeline layer using WebSockets. Users are separated into isolated virtual "rooms" when entering a contest challenge page.
* **Instant Scoreboard Recalculation Core:** Refactored the core validation engine to process aggregates whenever a user hits an `ACCEPTED` status. It recalculates the scoreboard ($10\text{ pts}$ for Easy, $30\text{ pts}$ for Medium, $50\text{ pts}$ for Hard) and broadcasts updated standings to all connected browsers instantly.

### 💻 2. Local Compiler Execution Sandboxes
* **Scratchpad File Lifecycle Automation:** Engineered isolated execution pipelines inside `backend/src/app.ts`. Code from the Monaco Editor is written to a unique disk path, compiled using system binaries, and cleaned up automatically upon teardown.
* **Multi-Language Runtime Track Management:**
  * **Python 3 Track:** Utilizes process stream callbacks to capture standard outputs (`stdout`) and execution error parameters (`stderr`) safely.
  * **C++ 17 (GCC) Track:** Pipes raw code files directly through local `g++` compilation processes, checks for syntax anomalies, executes the resulting binaries, and maps custom standard input (`stdin`) arguments smoothly.

### 🛡️ 3. Full-Stack Stability Patches & UX Refinements
* **Self-Healing Database Seeders:** Patched the server initialization lifecycle to automatically detect and auto-seed the `languages` reference lookup index rows upon boot, preventing foreign key constraint crashes after a database reset.
* **Granular Network Exception Capturing:** Upgraded frontend authentication forms (`/login` and `/register`) to unpack Zod validation array elements and network errors dynamically, displaying exact issue strings instead of generic messages.
* **Unified Domain CORS Handshake:** Restructured the application middleware hierarchy to process cross-origin resource isolation rules correctly. Unified local cookies and configurations to explicitly use `localhost` across the full stack.
* **Unmasked Workspace Terminals:** Refactored frontend workspace catch blocks to stop hiding backend exceptions behind generic text boxes, passing raw compiler issues directly down to the terminal view.