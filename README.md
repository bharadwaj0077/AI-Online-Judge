# ⚡ SynapseJudge — AI-Powered Online Judge & Real-Time Engineering Arena

An enterprise-grade, full-stack Competitive Programming, Real-Time 1v1 Multiplayer Coding, and Conversational AI Technical Interview platform. Engineered with a resilient N-Tier layered architecture, Docker container sandboxing, low-latency Socket.io WebSockets, Google Gemini 2.5 Flash / Cascade intelligence, and a Monaco-powered developer workspace.

---

## 🚀 Key Flagship Innovations

### 1. ⚔️ 1v1 Real-Time Code Wars Arena (`/arena`)
- **Instant Matchmaking & Custom Rooms:** Compete live in Ranked or Blitz duels, or generate private room codes (`ARENA-XXXX`) for 1v1 matches.
- **Real-Time Keystroke Progress Streaming:** Stream opponent character counts, line counts, and cursor movements live over WebSockets.
- **Sentinel Anti-Cheat:** Detects clipboard dump malpractice (>150 characters), rapid bursts, and tab-switching blur events with logged warnings.
- **CyberGrandmaster AI Practice Bot:** Challenge an autonomous AI competitor that simulates human typing cadence and strategic code submissions.
- **Grandmaster AI Referee:** Evaluates both implementations side-by-side on a **100-point rubric** (Correctness: 40, Efficiency: 25, Cleanliness: 20, Conduct: 15).
- **Replay Theater:** Relive every keystroke, pause, paste warning, and submission with millisecond-precision playback.

### 2. 🎙️ Conversational AI Mock Interviewer (`/interview`)
- **Push-to-Talk "Tap to Speak" Engine:** Hardware microphone recording activated on demand with real-time audio visualizer feedback.
- **Direct Speech Streaming:** Spoken candidate words stream live into the prompt input box, with automatic submission after 2 seconds of silence or clicking "Done Speaking".
- **4 Voice Personas:**
  - **Alex** (Staff SWE): Male · Calm, Analytical, Approachable (`male_soft`)
  - **Marcus** (Principal Architect): Male · Deep, Assertive, Authoritative (`male_bold`)
  - **Sarah** (Engineering Lead): Female · Clear, Encouraging, Articulate (`female_soft`)
  - **Elena** (Director of Engineering): Female · Crisp, Direct, Executive (`female_bold`)
- **CS Fundamentals Bank:** Concurrency, Operating Systems, Computer Networks, Relational DBMS & SQL, and Object-Oriented Architecture.
- **Custom Specifications:** Customize target company (e.g. Google, Palantir, Meta), target seniority, and problem topic dynamically.
- **FAANG-Calibrated Scorecard:** Multi-metric hiring evaluation with strengths, growth areas, and executive hiring recommendation (`STRONG_HIRE`, `LEANING_HIRE`, etc.).

### 3. 🎬 Visual Algorithm Execution Profiler (`/visualizer`)
- **Dual Workspace Integration:** Accessible via the dedicated Standalone Playground (`/visualizer`) and integrated directly inside Problem Workspaces (`/problems/[slug]`).
- **7 Algorithmic Presets:** Two Pointers, Binary Search, Singly Linked List Reversal, Monotonic Stack, Queue BFS, Binary Trees, and 2D DP Grids.
- **Dynamic Execution (Zero Hardcoding):** Dynamically evaluates whatever code and input the user supplies with real-time syntax line tracking.
- **Animated Canvas & SVG Renderers:** Step forward/backward through execution with animated pointer arrows (`low`, `mid`, `high`), memory cells, and stack canisters.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router), React 19, TypeScript | Server-Side Rendering (SSR), responsive layout routing, and fluid client state. |
| **Styling & Design** | Tailwind CSS, Lucide Icons | Dark-mode interface, glassmorphism, glowing accents, and micro-animations. |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | In-browser syntax highlighting, multiple themes (`synapse`, `midnight`, `cyberpunk`), and split-pane resizable layouts. |
| **Backend API Gateway**| Node.js, Express 5, TypeScript | RESTful route orchestration, Zod schema validation, and middleware security pipelines. |
| **Real-Time WebSockets**| Socket.io 4.8+ | Low-latency bidirectional event pipelines for 1v1 arenas and live voice interviews. |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM 7 (`@prisma/adapter-pg`) | Relational persistence, connection pooling, and partial/composite index optimization. |
| **Sandboxing Engine** | Docker (Python 3.11, GCC 13, OpenJDK 17, Node 20) | Isolated OS micro-containers (`--network none`, 256MB RAM) for secure remote code execution. |
| **AI Intelligence** | Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash | Tiered hints, failure diagnosis, Big-O complexity, AI refereeing, and voice dialogue. |
| **Cloud Deployment** | AWS RDS, AWS EC2 (`m7i-flex.large`), PM2 | Production managed PostgreSQL and 24/7 daemonized backend server. |

---

## 🏛️ System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client ["Client Interface (Next.js 14+)"]
        IDE["Monaco Workspace (/problems/[slug])"]
        Arena["1v1 Code Wars Arena (/arena)"]
        Interview["AI Voice Studio (/interview)"]
        Profiler["Visual Profiler (/visualizer)"]
        Dashboard["Developer Dashboard (/dashboard)"]
    end

    subgraph Gateway ["API & Real-Time Gateway (Express 5)"]
        REST["REST API Gateway (/api/v1)"]
        Sockets["Socket.io WebSocket Hub"]
        AuthGuard["JWT HttpOnly Cookie Firewall"]
        ZodGuard["Zod Schema Validation Guard"]
    end

    subgraph Services ["Service Orchestration Tier"]
        JudgeSvc["Judge Service (Fail-Fast Batch Runner)"]
        ArenaSvc["Arena Engine (State Machine & Telemetry)"]
        InterviewSvc["Mock Interview Service (Conversational Core)"]
        ProfilerSvc["Visual Profiler (Gemini Step Tracer)"]
        AiMentorship["AI Mentorship (Tiered Hints & Diagnosis)"]
        RefereeSvc["AI Grandmaster Referee (100-pt Rubric)"]
    end

    subgraph Sandboxes ["Docker Micro-Containers"]
        PyBox["python:3.11-slim (256MB / No-Network)"]
        CppBox["gcc:11 (256MB / No-Network)"]
        NodeBox["node:20-slim (256MB / No-Network)"]
    end

    subgraph Persistence ["Persistence & Intelligence"]
        Prisma["Prisma ORM 7 + Driver Adapter"]
        Postgres[("PostgreSQL 16+ Production DB")]
        Gemini["Google Gemini 2.5 Flash / Cascade"]
    end

    Client --> Gateway
    Gateway --> Services
    JudgeSvc --> Sandboxes
    Services --> Persistence
    ArenaSvc --> Sockets
    InterviewSvc --> Sockets
```

---

## 🏛️ Milestones & Engineering Deliverables

### Milestone 1: Core Relational Database Specification
- **Dual-ID Isolation Pattern:** `id: BIGINT` for internal foreign key joins; `public_id: UUIDv4` for external API masking.
- **Production Soft Deletes:** `deleted_at` timestamp with conditional partial unique indexes (`WHERE deleted_at IS NULL`).
- **Composite Performance Indexes:** High-throughput indices on `test_cases(problem_id, order_no)` and `submissions(user_id, problem_id)`.
- **Decoupled Language Matrix:** Compiler flags, image tags, and runtimes stored in `languages` table.

### Milestone 2: Express Foundation & Cryptographic Session Authentication
- **Layered N-Tier Tree:** Decoupled `config`, `routes`, `middlewares`, `controllers`, `services`, and `sockets`.
- **Bcrypt Security:** 12-round salted asynchronous password hashing.
- **HttpOnly Cookie Sessions:** Cryptographically signed JWT tokens dispatched in `HttpOnly`, `SameSite=Lax` cookies to mitigate XSS vulnerabilities.

### Milestone 3: Problem Management Subsystem & Query Filtering
- **Atomic Problem CRUD:** Slug auto-generation, search filters, and difficulty pagination.
- **Zod Request Parsing:** Strict boundary validation on problem bodies, LaTeX equations, and markdown statements.

### Milestone 4: Nested Test Case Subsystem & Batch Ingestion
- **Data Separation:** 2 public sample cases (`isSample: true`) rendered in the browser; 8 hidden cases (`isSample: false`) protected on the server.
- **Batch Processing:** Atomic ingestion of test suites via `prisma.$transaction`.

### Milestone 5: Ephemeral Docker Sandbox Engine
- **Resource Ceilings:** 256MB RAM, 0.5 CPU cores, `--network none` network isolation.
- **Cross-Platform Output Normalizer:** Strips carriage returns (`\r\n` vs `\n`) across host OS and Linux containers.
- **Verdict Matrix:** Precise classification: `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `RUNTIME_ERROR`.

### Milestone 6: Persistent Submissions & Atomic Aggregations
- **Two-Phase Lifecycle:** Initial `PENDING` write followed by atomic verdict resolution.
- **Anti-Exploit Counters:** Increment unique accepted challenge counters without duplicate metrics on repeat submissions.

### Milestone 7: AI-Powered Code Analysis & Mentorship
- **Tiered Hints Engine:** 3-tier progressive hints (Conceptual, Algorithmic Pattern, Pseudocode).
- **Failure Diagnosis ("Why Did My Code Fail"):** Identifies root cause logic flaws and edge cases.
- **Asymptotic Big-O Complexity:** Automated Time and Space Complexity calculation with algorithmic justifications.

### Milestone 8: Monaco Workspace & Interactive IDE
- **Split-Pane Layout:** Drag-handle resizable panels with console I/O, test case runners, and problem statements.
- **Theme Skinning:** `synapse` dark, `midnight` deep blue, and `cyberpunk` neon themes.

### Milestone 9: Role-Based Admin Panel & Edge Middleware
- **RBAC Security Guard:** Edge middleware restricting administrative control centers to `ADMIN` accounts.
- **AI Test Case Generator:** Gemini-powered generation of edge cases and stress tests.

### Milestone 10: Real-Time Contests & Global Leaderboards
- **Contest Schedules:** Live contest countdowns, scheduled start times, and weighted scoreboards.
- **Global Leaderboard:** Accurate ranking calculations based on accepted submissions.

### Milestone 11: Multi-Case Parallel Execution & Dynamic Templating
- **Concurrent Batch Processor:** Parallel sandbox spawning with dynamic runtime token injection (`{{USER_CODE}}`, `{{INPUT}}`).

### Milestone 12: Production Cloud Architecture (AWS Deployment)
- **AWS RDS PostgreSQL:** Managed TLS-secured PostgreSQL cluster.
- **AWS EC2 Ubuntu 24.04:** `m7i-flex.large` compute node with pre-pulled Docker compiler images and PM2 process management.

### Milestone 13: 1v1 Real-Time Code Wars Arena
- **Matchmaking & Private Lobbies:** Matchmaking queues and custom room codes (`ARENA-XXXX`).
- **Telemetry Streaming:** Live keystroke streaming, line counts, and cursor tracking.
- **Sentinel Anti-Cheat:** Detects clipboard dump malpractice and tab-switching blur events.
- **Grandmaster AI Referee:** Multi-dimensional 100-point scoring rubric with Replay Theater persistence.

### Milestone 14: Conversational AI Mock Interviewer
- **Push-to-Talk Speech Engine:** Hardware microphone recording with live speech-to-text prompt streaming.
- **4 Voice Personas:** Alex, Marcus, Sarah, Elena with custom speech synthesis.
- **CS Fundamentals Bank:** OS, Concurrency, CN, DBMS, SQL, OOP.
- **FAANG Scorecards:** Rigorous hiring rubric with actionable technical and communication feedback.

### Milestone 15: Visual Algorithm Execution Profiler
- **Dual Integration:** Standalone Playground (`/visualizer`) and Workspace Profiler (`/problems/[slug]`).
- **Step-by-Step Memory Canvas:** Animated pointers, linked list reversal, stack canisters, queues, trees, and DP grids.
- **Dynamic Input Profiling:** Evaluates any user code and inputs dynamically with zero hardcoding.

---

## 📊 End-to-End Verification Audit Results

All subsystems and features are audited and verified via automated test suites:

| Subsystem / Test Suite | File | Tests Run | Result | Pass Rate |
| :--- | :--- | :---: | :---: | :---: |
| **Visual Algorithm Profiler** | `verify_visual_profiler.js` | 33 | **33 PASSED** | **100%** |
| **AI Mock Interview & 4 Voices**| `verify_mock_interview_voices.js` | 10 | **10 PASSED** | **100%** |
| **CS Fundamentals & Custom Interview** | `verify_cs_and_custom_interview.js` | 43 | **43 PASSED** | **100%** |
| **1v1 Arena & AI Referee** | `verify_step3_arena.js` | 23 | **23 PASSED** | **100%** |
| **Core Judge & Tiered Hints** | `verify_step1_and_all_functions.js` | 21 | **21 PASSED** | **100%** |
| **Admin Problem CRUD & AI Tests**| `test_admin_crud.js` | 5 | **5 PASSED** | **100%** |
| **Frontend TypeScript Typecheck**| `npx tsc --noEmit` | — | **0 Errors** | **100%** |
| **TOTAL** | | **135** | **135 PASSED** | **100%** |

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** >= 20.x
- **Docker Desktop** (running with Linux containers enabled)
- **PostgreSQL** 16+

### 2. Clone & Environment Setup
```bash
git clone https://github.com/bharadwaj0077/AI-Online-Judge.git
cd AI-Online-Judge
```

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/online_judge_db"
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-chars"
GEMINI_API_KEY="your-gemini-api-key"
NODE_ENV="development"
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 3. Database Initialization & Seeding
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 4. Frontend Launch
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Detailed Documentation Directory
- [REST & WebSocket API Reference](docs/api.md)
- [System Architecture & UML Diagrams](docs/architecture.md)
- [Database Schema & ER Diagrams](docs/database.md)
- [Engineering Roadmap](docs/roadmap.md)