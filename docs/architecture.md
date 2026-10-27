# 🏛️ System Architecture Specification — SynapseJudge

This document provides the definitive architectural blueprint of the software design patterns, architectural layers, data flows, security infrastructure, and real-time event loops governing the **SynapseJudge** online judge and engineering preparation platform.

---

## 1. High-Level Architectural Topology

SynapseJudge is engineered using a decoupled, **N-Tier Layered Architecture** with reactive micro-engines for real-time WebSocket communication, Docker micro-container sandboxing, and multimodal generative AI orchestration.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Workspace (Next.js 14+ App Router)"]
        UI["Monaco Editor Workspace"]
        ArenaUI["1v1 Code Wars Arena (/arena)"]
        InterviewUI["AI Voice Interview Studio (/interview)"]
        ProfilerUI["Visual Execution Profiler (/visualizer)"]
        DashboardUI["Developer Dashboard & Contests"]
    end

    subgraph GatewayLayer ["Network Gateway & Middlewares (Express 5 + TypeScript)"]
        ReverseProxy["HTTP / REST API Gateway (/api/v1)"]
        SocketHub["Real-Time Socket.io Gateway Hub"]
        AuthShield["JWT Cookie Firewall & RBAC Guard"]
        ZodGuard["Zod Schema Validation Guard"]
    end

    subgraph ServiceLayer ["Core Service Orchestration Engine"]
        JudgeSvc["Judge Service (Fail-Fast Batch Runner)"]
        ArenaSvc["Arena Service (State Machine & Telemetry)"]
        InterviewSvc["Mock Interview Service (Conversational Engine)"]
        ProfilerSvc["Visual Profiler Service (Gemini Step Tracer)"]
        AiMentorshipSvc["AI Mentorship Service (Tiered Hints & Diagnosis)"]
        RefereeSvc["AI Grandmaster Referee (100-pt Scoring)"]
    end

    subgraph ExecutionLayer ["Isolated Code Sandbox Engine"]
        DockerHost["Docker Micro-Containers"]
        PyRunner["python:3.11-slim (256MB / No-Network)"]
        CppRunner["gcc:11 (256MB / No-Network)"]
        NodeRunner["node:20-slim (256MB / No-Network)"]
    end

    subgraph PersistenceLayer ["Storage & Intelligence Tier"]
        Prisma["Prisma ORM 7 + @prisma/adapter-pg"]
        Postgres[("PostgreSQL 16+ Production DB")]
        GeminiCascade["Google Gemini 2.5 Flash / Cascade"]
        TTS["Web Speech Synthesis & Native Voice API"]
    end

    ClientLayer --> GatewayLayer
    GatewayLayer --> ServiceLayer
    JudgeSvc --> ExecutionLayer
    ServiceLayer --> PersistenceLayer
    ArenaSvc --> SocketHub
    InterviewSvc --> SocketHub
```

---

## 2. Real-Time 1v1 Arena WebSocket Pipeline

The **1v1 Code Wars Arena** operates over high-frequency bidirectional WebSockets managing matchmaking, live keystroke progress broadcasting, Sentinel anti-cheat malpractice detection, and post-match AI Grandmaster Referee evaluation.

```mermaid
sequenceDiagram
    autonumber
    actor Player1 as Candidate 1
    actor Player2 as Candidate 2
    participant Socket as Socket.io Gateway
    participant ArenaSvc as Arena Engine
    participant Sentinel as Sentinel Anti-Cheat
    participant Docker as Sandbox Execution
    participant Referee as AI Grandmaster Referee

    Player1->>Socket: arena:join_queue { mode: "blitz" }
    Player2->>Socket: arena:join_queue { mode: "blitz" }
    Socket->>ArenaSvc: matchMake(P1, P2)
    ArenaSvc->>Socket: arena:match_start { matchId, problem, durationSec }
    Socket-->>Player1: Render Workspace & Timer
    Socket-->>Player2: Render Workspace & Timer

    loop Real-Time Keystroke Progress
        Player1->>Socket: arena:keystroke { code, cursor }
        Socket-->>Player2: arena:opponent_progress { charCount, lineCount, cursor }
    end

    opt Malpractice Detection
        Player2->>Socket: arena:anti_cheat_alert { reason: "PASTE_DUMP > 150 chars" }
        Socket->>Sentinel: recordWarning(P2)
        Sentinel-->>Player2: arena:anti_cheat_warning { warnings: 1/2 }
    end

    Player1->>Socket: arena:submit_solution { code, verdict: "ACCEPTED", passed: 10/10 }
    Socket->>ArenaSvc: recordSubmission(P1)
    
    Player2->>Socket: arena:submit_solution { code, verdict: "ACCEPTED", passed: 10/10 }
    Socket->>ArenaSvc: recordSubmission(P2)

    Note over ArenaSvc,Referee: Both submissions recorded -> Trigger AI Referee
    ArenaSvc->>Referee: evaluateBattle(P1Summary, P2Summary)
    Referee-->>ArenaSvc: RefereeDecision { winner: "Player1", scores, commentary }
    ArenaSvc->>Socket: arena:match_concluded { match, decision }
    Socket-->>Player1: Display Victory Banner & Scorecard
    Socket-->>Player2: Display Defeat Banner & Scorecard
```

---

## 3. Conversational AI Mock Interviewer Architecture

The **AI Mock Interviewer** allows candidates to simulate technical interviews using **Push-to-Talk speech**, real-time audio visualizers, and four calibrated voice personas across Computer Science domains.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant Mic as Push-to-Talk Engine
    participant WebPage as Next.js Interview Studio
    participant Socket as Interview WebSocket
    participant Cascade as Gemini Cascade LLM
    participant TTS as Voice Synthesis Engine

    Candidate->>WebPage: Select Persona ("Marcus - Principal Architect") & Domain ("OS & Concurrency")
    WebPage->>Socket: interview:join { interviewId }
    Socket-->>WebPage: interview:interviewer_speech { greeting, starterProblem }

    Candidate->>Mic: Tap to Speak (Hardware Mic Recording)
    Mic-->>WebPage: Live Speech-to-Text streaming directly into prompt box
    Candidate->>Mic: Click "Done Speaking (Send)" / Auto-Silence 2s
    WebPage->>Socket: interview:candidate_speech { userSpeech, currentCode, language }
    
    Socket-->>WebPage: interview:interviewer_status { status: "thinking" }
    Socket->>Cascade: Analyze speech + code + requirements
    Cascade-->>Socket: Interviewer response + follow-up probe
    
    Socket-->>WebPage: interview:interviewer_status { status: "speaking" }
    Socket->>TTS: Synthesize voice with Marcus persona parameters
    Socket-->>WebPage: interview:interviewer_speech { reply, audioStream }
    WebPage-->>Candidate: Play audio + animate wave visualizer + update transcript

    opt Finalize Interview
        Candidate->>WebPage: Conclude Interview
        WebPage->>Socket: interview:end_session { finalCode, telemetry }
        Socket->>Cascade: Generate FAANG Rubric Scorecard
        Cascade-->>Socket: Scorecard { technical: 88, communication: 90, verdict: "STRONG_HIRE" }
        Socket-->>WebPage: interview:scorecard_ready { scorecard }
        WebPage-->>Candidate: Render Executive Hiring Scorecard
    end
```

---

## 4. Visual Algorithm Execution Profiler Pipeline

The **Visual Algorithm Execution Profiler** evaluates arbitrary student code dynamically and synthesizes a step-by-step memory frame timeline.

```mermaid
flowchart LR
    subgraph InputStage ["Input Parameters"]
        Code["Source Code (Python/JS)"]
        InputData["Test Input (e.g. nums=[2,7,11,15], target=9)"]
        Context["Problem Title / Presets"]
    end

    subgraph ProfilerEngine ["Visual Profiler Service"]
        PromptGen["Dynamic Line Tracer Prompt Generator"]
        CascadeAI["Gemini Cascade Inference"]
        Normalizer["Memory Frame Normalizer & Sanitizer"]
        Fallback["Deterministic Algorithmic Fallback Tracer"]
    end

    subgraph OutputFrames ["Structured JSON Execution Frames"]
        Steps["steps: Array<VisualStep>"]
        Arrays["arrays & pointers (low, mid, high)"]
        LinkedLists["linkedLists & node pointers (prev, curr, nxt)"]
        Stacks["stacks (PUSH_STACK, POP_STACK)"]
        Queues["queues (ENQUEUE, DEQUEUE)"]
        Trees["trees (TREE_TRAVERSE)"]
        Matrices["matrices (MATRIX_UPDATE)"]
    end

    subgraph CanvasRenderer ["Frontend Canvas & SVG Renderer"]
        Scrubber["Scrubber / Timeline Stepper"]
        MonacoSync["Active Line Monaco Highlight"]
        Animation["Animated Arrow Transitions"]
    end

    InputStage --> ProfilerEngine
    PromptGen --> CascadeAI
    CascadeAI --> Normalizer
    CascadeAI -.->|On Quota / Network Error| Fallback
    Normalizer --> OutputFrames
    Fallback --> OutputFrames
    OutputFrames --> CanvasRenderer
```

---

## 5. Docker Sandbox Execution & Fail-Fast Grading Loop

Untrusted candidate code is evaluated inside ephemeral Linux containers with strict kernel-level resource caps.

```mermaid
flowchart TD
    Start(["Submission Received"]) --> SavePending["Save Submission (status: PENDING)"]
    SavePending --> FetchCases["Fetch 2 Sample + 8 Hidden Test Cases"]
    FetchCases --> SpawnContainer["Spawn Ephemeral Docker Container (--network none, 256MB RAM, 0.5 CPU)"]
    
    subgraph EvalLoop ["Sequential Fail-Fast Test Case Loop"]
        InjectCase["Inject Test Case i Input"] --> ExecCode["Execute Code with Hard Timeout (1000ms)"]
        ExecCode --> CheckTLE{"Exceeded Time?"}
        CheckTLE -- Yes --> TLEVerdict["Verdict: TIME_LIMIT_EXCEEDED"]
        CheckTLE -- No --> CheckCrash{"Non-Zero Exit?"}
        CheckCrash -- Yes --> RTEVerdict["Verdict: RUNTIME_ERROR"]
        CheckCrash -- No --> CompareOutput{"Output Matches Expected?"}
        CompareOutput -- No --> WAVerdict["Verdict: WRONG_ANSWER (Halt on first failed case)"]
        CompareOutput -- Yes --> MoreCases{"More Cases Remaining?"}
        MoreCases -- Yes --> NextCase["i = i + 1"] --> InjectCase
        MoreCases -- No --> ACVerdict["Verdict: ACCEPTED (10/10 Passed)"]
    end

    SpawnContainer --> EvalLoop
    TLEVerdict --> Terminate["Terminate Container (docker kill)"]
    RTEVerdict --> Terminate
    WAVerdict --> Terminate
    ACVerdict --> Terminate
    Terminate --> UpdateDB["Update Submission in PostgreSQL & Increment User Solved Tally"]
    UpdateDB --> End(["Return Evaluation Result"])
```

---

## 6. Security Infrastructure & Guardrails

| Layer | Threat Vector | Mitigation Strategy |
| :--- | :--- | :--- |
| **Authentication** | Credential stuffing & XSS | HttpOnly, SameSite=Lax, Secure cookies; Bcrypt password hashing (12 rounds). |
| **Code Execution** | Remote Code Execution (RCE), Fork bombs | Isolated Docker micro-containers, `--network none`, 256MB RAM limit, read-only root filesystems where applicable. |
| **Multiplayer Arena** | Clipboard paste malpractice, tab switching | Client-side Sentinel hooks detecting clipboard dumps (>150 characters) and window blur events with recorded infractions. |
| **Data Masking** | Malicious ID enumeration | Dual-ID architecture: `public_id` (random UUIDv4) for client APIs; internal `BIGINT` for performant database joins. |
| **API Abuse** | Redundant LLM calls & double-billing | Caching verified AI hints and diagnoses in database tables (`ai_feedback`). |