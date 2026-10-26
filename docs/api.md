# 🛣️ REST & Real-Time WebSocket API Specification — SynapseJudge Engine

This document provides the complete, production-grade technical specification for all RESTful endpoints and real-time WebSocket pipelines provided by the SynapseJudge platform under the global API version prefix `/api/v1`.

---

## 1. Global Network Layer Standards

- **Base URL (Local):** `http://localhost:5000/api/v1`
- **Base URL (Production AWS):** `https://api.synapsejudge.com/api/v1`
- **Default Data Format:** `application/json`
- **Authentication & Security:** Cryptographically signed JWT tokens issued via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies, isolating session keys from browser memory extraction and XSS vectors.
- **WebSocket Gateway:** Real-Time Socket.io 4.8+ engine mounted directly on the HTTP server layer.

---

## 2. Uniform Response Envelopes

### A. Success Envelope (2xx HTTP Status)
```json
{
  "success": true,
  "message": "Descriptive message tracking the completed action.",
  "data": {}
}
```

### B. Validation Error Envelope (400 Bad Request)
Emitted by the Zod Schema Validation Guard when incoming payloads violate boundary constraints.
```json
{
  "success": false,
  "message": "Validation failed parsing incoming parameters.",
  "errors": {
    "field": ["Specific error constraint message"]
  }
}
```

### C. Runtime & Exception Envelope (4xx / 5xx HTTP Status)
```json
{
  "success": false,
  "message": "Detailed runtime error description.",
  "stack": "Stack trace exposed only in [development] mode."
}
```

---

## 3. Authentication & Profile Subsystem

### `POST /auth/register`
Creates a new coder account with salted password hashing (Bcrypt with 12 workload rounds).
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "coder_pro",
    "email": "coder@domain.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "id": "1",
        "publicId": "e5b8d2a1-7c9f-4b0e-8d2a-1c7b9f4b0e8d",
        "username": "coder_pro",
        "email": "coder@domain.com",
        "role": "USER"
      }
    }
  }
  ```

### `POST /auth/login`
Authenticates credentials and dispatches an `HttpOnly` JWT cookie (`token`).
- **Access:** Public
- **Request Body:**
  ```json
  {
    "identifier": "coder_pro", // or email
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": { "username": "coder_pro", "role": "USER" },
      "token": "<JWT_STRING>"
    }
  }
  ```

### `POST /auth/logout`
Instantly revokes session cookies.
- **Access:** Authenticated
- **Response (200 OK):** Sets cookie expiry to 1970 UTC.

### `GET /auth/me`
Restores user session and profile data across client page refreshes.
- **Access:** Authenticated via cookie or Bearer token.
- **Response (200 OK):** Returns active user object.

---

## 4. Problem Directory & Code Sandbox Execution

### `GET /problems`
Fetches the catalog of competitive problems with search, difficulty filtering, and pagination.
- **Query Parameters:** `difficulty` (EASY|MEDIUM|HARD), `search` (string), `page` (number), `limit` (number).
- **Access:** Public

### `GET /problems/:slug`
Retrieves a problem's statement, constraints, templates, and **sample test cases only** (hidden test cases are strictly excluded from client responses).
- **Access:** Public

### `POST /problems/:slug/run`
Executes code inside an ephemeral isolated Docker container (`--network none`, 256MB RAM limit) against custom or sample inputs.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "code": "def solve(nums): return sum(nums)",
    "language": "python3",
    "customInput": "[1, 2, 3, 4]"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "output": "10\n",
      "executionTimeMs": 42,
      "memoryUsedKb": 14200,
      "verdict": "ACCEPTED"
    }
  }
  ```

### `POST /problems/:slug/submit`
Executes full LeetCode-grade evaluation across all 10 sample and hidden test cases with **fail-fast** termination on the first failing case.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "code": "class Solution: ...",
    "language": "python3"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "verdict": "ACCEPTED",
      "passedTestCases": 10,
      "totalTestCases": 10,
      "executionTimeMs": 48,
      "memoryUsedKb": 15400
    }
  }
  ```

---

## 5. AI Mentorship & Intelligence Engine

### `POST /problems/:id/tiered-hints`
Generates or retrieves 3 progressive, calibrated hints (Tier 1 Conceptual, Tier 2 Algorithmic Pattern, Tier 3 Pseudocode) without spoiling direct answers.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "code": "class Solution: ...",
    "language": "python3",
    "unlockedTiers": [1]
  }
  ```
- **Response (200 OK):** Returns array of hints with `tier`, `title`, `content`, and `keyTakeaway`.

### `POST /problems/:id/diagnose`
Analyzes a failed submission and explains the exact logical root cause, edge case violation, and suggested correction.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "code": "...",
    "language": "python3",
    "failedTestCase": { "input": "[3, 3]", "expected": "6", "actual": "0" },
    "verdict": "WRONG_ANSWER"
  }
  ```

### `POST /problems/:id/verdict`
Calculates asymptotic Big-O Time and Space Complexity for candidate code using AST and execution pattern heuristics.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "timeComplexity": "O(N)",
      "spaceComplexity": "O(1)",
      "explanation": "Single-pass linear scan with constant additional pointer variables."
    }
  }
  ```

---

## 6. Visual Algorithm Execution Profiler

### `GET /profiler/presets`
Returns all 7 registered algorithm visual presets with dual-language starter implementations.
- **Presets Available:** `two-pointers`, `binary-search`, `linked-list`, `stack`, `queue`, `tree`, `matrix`.
- **Response (200 OK):** Array of presets with descriptions and starter code.

### `POST /profiler/trace` & `POST /problems/:slug/trace`
Dynamically evaluates user code and input to generate a step-by-step memory frame execution timeline.
- **Request Body:**
  ```json
  {
    "code": "def two_sum_sorted(nums, target): ...",
    "language": "python3",
    "input": "nums = [2, 4, 7, 11, 15, 20], target = 18",
    "problemTitle": "Two Pointers Sum"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "totalSteps": 27,
    "steps": [
      {
        "stepIndex": 1,
        "lineNumber": 16,
        "action": "INIT",
        "explanation": "Calling two_sum_sorted with nums=[2, 4, 7, 11, 15, 20] and target=18.",
        "structures": {
          "arrays": [{ "id": "nums", "name": "nums", "elements": [...] }],
          "pointers": [{ "name": "left", "arrayId": "nums", "index": 0, "color": "#38bdf8" }],
          "variables": { "left": 0, "right": 5, "target": 18 }
        }
      }
    ],
    "summary": "Execution completed in 27 steps finding indices [0, 4]."
  }
  ```

---

## 7. 1v1 Code Wars Arena (REST & WebSockets)

### REST Endpoints
- `GET /arena/matches`: Lists recent matches and live duels.
- `GET /arena/custom-room`: Generates an alphanumeric private match code (`ARENA-XXXX`).
- `GET /arena/replay/:matchId`: Retrieves the full millisecond-precision replay timeline and persisted AI Grandmaster Referee decision.

### WebSocket Interface (Namespace: `/`)
Connected clients participate in real-time PvP coding duels:

| Event Name | Direction | Payload Structure | Description |
|---|---|---|---|
| `arena:join_queue` | Client ➔ Server | `{ userId, username, mode, difficulty }` | Enters public matchmaking queue. |
| `arena:create_room` | Client ➔ Server | `{ userId, username, roomCode, mode, difficulty }` | Hosts private match lobby. |
| `arena:join_room` | Client ➔ Server | `{ userId, username, roomCode }` | Joins private match by code. |
| `arena:spawn_ai_bot` | Client ➔ Server | `{ userId, username, mode, difficulty }` | Spawns CyberGrandmaster AI Practice Bot. |
| `arena:keystroke` | Client ➔ Server | `{ matchId, userId, code, cursor }` | Broadcasts real-time typing progress. |
| `arena:anti_cheat_alert` | Client ➔ Server | `{ matchId, userId, reason }` | Logs clipboard paste (>150 chars) or tab switch. |
| `arena:submit_solution` | Client ➔ Server | `{ matchId, userId, code, verdict, passedCases }` | Submits solution for referee grading. |
| `arena:surrender` | Client ➔ Server | `{ matchId, userId }` | Forfeits match immediately. |
| `arena:match_start` | Server ➔ Client | `{ matchId, problem, player1, player2, durationSec }` | Fires when both players connect. |
| `arena:opponent_progress`| Server ➔ Client | `{ userId, charCount, lineCount, cursor }` | Streams opponent code metrics. |
| `arena:anti_cheat_warning`| Server ➔ Client | `{ totalWarnings, message }` | Warns player of detected malpractice. |
| `arena:match_concluded` | Server ➔ Client | `{ match, decision: { winnerName, reason, scores } }` | Dispatches 100-pt AI referee verdict. |

---

## 8. AI Conversational Mock Interviewer (REST & WebSockets)

### REST Endpoints
- `POST /interviews`: Spawns a new interview session with voice persona (`male_soft`, `male_bold`, `female_soft`, `female_bold`), topic (OS, CN, DBMS, SQL, OOP, Algorithms), seniority, and custom company.
- `GET /interviews`: Returns user interview history and past scorecards.
- `GET /interviews/:id`: Retrieves session status, problem brief, transcript history, and final scorecard.
- `POST /interviews/:id/turn`: Dispatches spoken candidate text and returns interviewer reply.
- `POST /interviews/:id/inspect`: Requests live code review feedback from the interviewer.
- `POST /interviews/:id/end`: Finalizes interview and computes FAANG-calibrated hiring evaluation.
- `GET /interviews/voice/preview?persona=male_soft`: Streams sample synthesized audio preview for voice selection.

### WebSocket Interface (Namespace: `/`)
Real-time, push-to-talk bidirectional voice and audio session stream:

| Event Name | Direction | Payload Structure | Description |
|---|---|---|---|
| `interview:join` | Client ➔ Server | `{ interviewId, userId }` | Connects candidate to dedicated interview room. |
| `interview:candidate_speech` | Client ➔ Server | `{ interviewId, userSpeech, currentCode, language }` | Dispatches candidate spoken input. |
| `interview:request_hint` | Client ➔ Server | `{ interviewId, currentCode, language }` | Solicits contextual interview hint. |
| `interview:request_review`| Client ➔ Server | `{ interviewId, currentCode, language }` | Requests line-by-line code evaluation. |
| `interview:test_run` | Client ➔ Server | `{ interviewId, passed, total, error }` | Notifies interviewer of sandbox test run. |
| `interview:end_session` | Client ➔ Server | `{ interviewId, finalCode, language, telemetry }` | Triggers final scorecard compilation. |
| `interview:interviewer_status`| Server ➔ Client | `{ status: "thinking" \| "speaking" \| "idle" }` | Live interviewer state animation stream. |
| `interview:interviewer_speech`| Server ➔ Client | `{ reply, audioUrl, transcript }` | Delivers AI interviewer speech response. |
| `interview:scorecard_ready` | Server ➔ Client | `{ scorecard, verdict, strengths, weaknesses }` | Delivers comprehensive hiring scorecard. |

---

## 9. Contests, Leaderboard & Metrics

### `GET /contests`
Lists scheduled, ongoing, and past algorithm contests with start times and duration windows.

### `GET /leaderboard`
Fetches global rankings calculated from accepted challenge submissions and contest points.

### `GET /dashboard?userId=:id`
Computes developer analytics:
```json
{
  "success": true,
  "data": {
    "problemsSolved": 14,
    "totalProblems": 103,
    "accuracyRate": "87.5%",
    "globalRating": 1640,
    "globalRank": "#12",
    "recentActivity": [...]
  }
}
```

---

## 10. Admin Management (RBAC: `ADMIN` Only)

### `GET /admin/problems`
Returns full problem directory including hidden test case counts and author metadata.

### `POST /admin/problems`
Creates a new problem with slug generation, difficulty assignment, and starter templates.

### `PUT /admin/problems/:id`
Updates problem statement, constraints, driver scripts, or reference solutions.

### `DELETE /admin/problems/:id`
Executes safe soft-deletion preserving historical submissions.

### `POST /admin/problems/:id/testcases/batch`
Ingests an array of test cases atomically inside a single database transaction.

### `POST /admin/ai/generate-testcases`
Employs Gemini Cascade to generate 5-10 high-coverage boundary, edge-case, and large-scale inputs for any problem brief.