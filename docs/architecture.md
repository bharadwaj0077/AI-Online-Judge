# 🏛️ System Architecture Specification

This document provides a comprehensive blueprint of the software design patterns, architectural layers, data flows, and security infrastructure governing the CodeForge Online Judge backend engine.

---

## 1. Architectural Design Pattern

The CodeForge backend is engineered using a decoupled, **Layered (N-Tier) Architecture**. This pattern enforces a strict separation of concerns, ensuring that network transportation rules, input validation firewalls, core business execution logic, and database persistence operations are completely isolated into independent layers. 


## 🏗️ Layered Architecture Pattern

The backend is engineered using a decoupled, **Layered (N-Tier) Architecture**. This separates responsibilities across explicit computational frames, preventing the leaking of database or network concerns into business workflows.

```text
[HTTP Request] ──> [Security/Parser Middlewares] ──> [Zod Validation Guard]
                                                                │
[JSON Response] <── [Global Error Interceptor] <── [Controllers] ◄┘
         ▲                                             │ (Data Mapping)
         │                                             ▼
  (Safe Envelope) <────────────────────────────── [Services] (Core Business Logic)
                                                       │
                                                       ▼
                                                [Prisma Client Singleton]
                                                       │ (Native Pool Adapter)
                                                       ▼
                                                [PostgreSQL Cluster]
```
### 🔄 End-to-End Request Workflow Diagram

```text
       [ CLIENT WORKSPACE ]
                 │
                 │  (HTTP Request / Payload)
                 ▼
     ┌───────────────────────┐
     │ 1. Express Gateway    │ ──► [Helmet (Security Shielding)]
     │    (& Middlewares)    │ ──► [CORS (Origin Access Guard)]
     └───────────────────────┘ ──► [Cookie Parser (Session Reader)]
                 │
                 ▼
     ┌───────────────────────┐
     │ 2. Validation Guard   │ ──► [Zod Schema Validation Engine]
     │    (Middleware)       │     (Aborts with 400 Bad Request if invalid)
     └───────────────────────┘
                 │
                 ▼ (Clean, Typed Data)
     ┌───────────────────────┐
     │ 3. REST Controller    │ ──► [Auth / Submission Interfaces]
     │    (Interface Layer)  │     (Maps streams, builds output envelopes)
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ 4. Business Service   │ ──► [Cryptographic Handshakes (Bcrypt)]
     │    (Core Logic Core)  │ ──► [Token Generation Module (JWT)]
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ 5. Data Access Layer  │ ──► [Prisma 7 Client Singleton]
     │    (ORM Framework)    │ ──► [@prisma/adapter-pg (Native Driver Pool)]
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ 6. Persistence Layer  │ ──► [PostgreSQL Database Instance]
     │    (Relational Store) │     (Advanced compound & partial indexes)
     └───────────────────────┘