# 🛣️ REST API Interface Specification — CodeForge Engine

This document outlines the operational network pathways, payload validation boundaries, cryptographic state mutations, and integration test specifications exposed by the backend routing tier via the global versioned network path prefix `/api/v1`.

---

## 1. Global Network Layer Baselines

- **Base URL Prefix:** `http://localhost:5000/api/v1`
- **Default Transportation Format:** `application/json`
- **Session Transport Layer:** Server-signed tokens packed into stateful, secure cookies to isolate sessions from browser scripting memory vulnerabilities.

---

## 2. Uniform JSON Response Envelopes

The gateway wraps all outgoing responses in standardized JSON wrappers. This allows frontend clients and automated API runners to consistently parse success metrics and handle validation errors.

### A. Operational Success Wrapper (2xx / 3xx Status Codes)

Returned when an endpoint passes its computational logic cleanly.

```json
{
  "success": true,
  "message": "Human-readable description tracking the completed action.",
  "data": {}
}
```

### B. Request Body Validation Errors (400 Bad Request)

Returned when incoming request bodies fail the structural constraints enforced by the underlying Zod validation schemas.

```json
{
  "success": false,
  "message": "Validation failed parsing incoming parameters.",
  "errors": {
    "_errors": [],
    "username": {
      "_errors": ["Username must contain at least 3 characters"]
    },
    "email": {
      "_errors": ["Invalid email structure"]
    },
    "password": {
      "_errors": ["Password must contain at least 8 elements"]
    }
  }
}
```

### C. Runtime Exception Errors (4xx / 5xx Status Codes)

Returned when a request fails authorization checks, hits data collisions, or triggers internal server faults.

```json
{
  "success": false,
  "message": "Specific runtime or structural error statement describing the exception.",
  "stack": "Error details exposed strictly within [development] environments only."
}
```

---

## 3. Core API Endpoint Catalog

### 1. Gateway Health Probe

- **HTTP Method:** `GET`
- **Target Path:** `/health`
- **Access Control:** Public
- **Description:** Monitors gateway processing conditions and verifies runtime pipeline accessibility.

**Success Outflow (200 OK):**

```json
{
  "success": true,
  "message": "CodeForge Engine Gateway Live."
}
```

---

### 2. Register User Profile

- **HTTP Method:** `POST`
- **Target Path:** `/auth/register`
- **Access Control:** Public
- **Description:** Parses credentials, evaluates data layout rules via Zod, verifies email/username uniqueness, hashes passwords via Bcrypt, and saves a new user record.

**Request Payload Parameters:**

| Parameter | Type | Required | Constraints |
|---|---|---|---|
| `username` | String | Required | Minimum 3 characters, maximum 30 characters. Alphanumeric and underscores only. |
| `email` | String | Required | Must match a structural, RFC-compliant email layout. |
| `password` | String | Required | Enforced structural minimum length of 8 characters. |
| `fullName` | String | Optional | Descriptive real identity naming string up to 100 characters. |

**Sample Input Payload:**

```json
{
  "username": "developer_alpha",
  "email": "alpha@codeforge.org",
  "password": "secure_password_123",
  "fullName": "Alpha Developer"
}
```

**Success Outflow (201 Created):**

```json
{
  "success": true,
  "message": "User account identity established successfully.",
  "data": {
    "publicId": "e2da157f-1d4e-4f18-a682-1c7c91d4e28a",
    "username": "developer_alpha",
    "email": "alpha@codeforge.org"
  }
}
```

---

### 3. Authenticate User Session

- **HTTP Method:** `POST`
- **Target Path:** `/auth/login`
- **Access Control:** Public
- **Description:** Verifies user credentials against active database records. If the password matching check passes, the engine generates an asymmetric JSON Web Token (JWT) and writes it directly to an encrypted browser cookie.
- **Security Side Effects:** Sets a browser cookie named `token` with flags: `HttpOnly`, `Secure=conditional` (enabled in production), `SameSite=Lax`, and an explicit `maxAge` of 7 days.

**Request Payload Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `username` | String | Required | Account handle text. |
| `password` | String | Required | Plaintext matching key word string. |

**Sample Input Payload:**

```json
{
  "username": "developer_alpha",
  "password": "secure_password_123"
}
```

**Success Outflow (200 OK):**

```json
{
  "success": true,
  "message": "Authentication handshake passed successfully.",
  "data": {
    "publicId": "e2da157f-1d4e-4f18-a682-1c7c91d4e28a",
    "username": "developer_alpha",
    "role": "USER"
  }
}
```

---

### 4. Terminate User Session

- **HTTP Method:** `POST`
- **Target Path:** `/auth/logout`
- **Access Control:** Public
- **Description:** Instantly revokes individual user validation cookies and purges token parameters across active network clients.

**Success Outflow (200 OK):**

```json
{
  "success": true,
  "message": "Session token terminated successfully."
}
```

---

## 4. Integration Verification Suite History

The core routing framework is verified against 12 automated integration testing milestones, tracking constraint thresholds, schema limits, database error handling, and authorization states.

### 📊 Integration Verification Performance Matrix

| Index ID | Test Condition Target | Target Endpoint Route | Input Body Payload Type | Expected Status | Actual Status | Operational Result Status |
|---|---|---|---|---|---|---|
| 1000 | Health Check Pipeline | GET /health | None | 200 OK | 200 OK | 🟩 PASS |
| 2000 | User Registration - Happy Path | POST /auth/register | Complete Valid JSON | 201 Created | 201 Created | 🟩 PASS |
| 3000 | Registration - Duplicate Email Check | POST /auth/register | Existing Email Address | 409 Conflict | 409 Conflict | 🟩 PASS |
| 4000 | Registration - Duplicate Username Check | POST /auth/register | Existing Account Username | 409 Conflict | 409 Conflict | 🟩 PASS |
| 5000 | Registration - Bad Username RegEx | POST /auth/register | Whitespace / Special Characters | 400 Bad Request | 400 Bad Request | 🟩 PASS |
| 6000 | Registration - Short Password Guard | POST /auth/register | Password Length < 8 | 400 Bad Request | 400 Bad Request | 🟩 PASS |
| 7000 | Registration - Missing Core Keys | POST /auth/register | Incomplete Key Parameters | 400 Bad Request | 400 Bad Request | 🟩 PASS |
| 8000 | User Session Login - Happy Path | POST /auth/login | Valid Match Credentials | 200 OK | 200 OK | 🟩 PASS |
| 9000 | User Session Login - Bad Password | POST /auth/login | Mismatched Credential Words | 401 Unauthed | 401 Unauthed | 🟩 PASS |
| 10000 | User Session Login - Missing User | POST /auth/login | Unregistered Username Handle | 401 Unauthed | 401 Unauthed | 🟩 PASS |
| 11000 | User Session Login - Empty Fields | POST /auth/login | Empty Payload Boundaries | 400 Bad Request | 400 Bad Request | 🟩 PASS |
| 12000 | User Session Logout - Safe Eviction | POST /auth/logout | None | 200 OK | 200 OK | 🟩 PASS |

### 🔍 Verification Audit Conclusion

The testing matrix registers a clean 12/12 PASS standard. All status flags, validation error layouts, data integrity blocks, and secure cookie headers match design patterns perfectly, freezing the authentication subsystem codebase as completely functional.


---

## 5. Core Problems API Endpoint Catalog

All endpoints below are exposed under the unified path prefix `/api/v1/problems`.

### 1. Create Problem

- **HTTP Method:** `POST`
- **Target Path:** `/problems`
- **Access Control:** Admin only (`ADMIN` role required)
- **Description:** Takes markdown problem statements, processes code runner bounds, and establishes the database entry.

---

### 2. Read Challenge Directory

- **HTTP Method:** `GET`
- **Target Path:** `/problems`
- **Access Control:** Logged-in users
- **Description:** Behaves intelligently based on permissions — standard `USER` accounts only receive publicly visible problems, while `ADMIN` profiles dynamically see hidden `DRAFT` items.

---

### 3. Read Individual Challenge

- **HTTP Method:** `GET`
- **Target Path:** `/problems/:slug`
- **Access Control:** Logged-in users
- **Description:** Resolves deep problem details via an easy-to-read web slug (e.g., `/problems/two-sum-classic`) instead of exposing database IDs.

---

### 4. Update Specification

- **HTTP Method:** `PUT`
- **Target Path:** `/problems/:publicId`
- **Access Control:** Admin only
- **Description:** Modifies constraints, descriptions, or difficulties. If an admin alters the challenge's title, the engine automatically recalculates and shifts the database search slug dynamically.

---

### 5. Soft-Delete Archive

- **HTTP Method:** `DELETE`
- **Target Path:** `/problems/:publicId`
- **Access Control:** Admin only
- **Description:** Rather than performing a destructive hard-delete that would wipe historical submission logs, it updates a `deletedAt` timestamp. The item vanishes from active lists while preserving complete historic database references.

---

## 6. Integration Verification Suite — Problems Module

The Problems API is verified against 11 automated integration testing milestones covering authentication, authorization, validation boundaries, and soft-delete isolation.

### 📊 Integration Verification Performance Matrix

| Stage ID | Target Test Case Description | Route Endpoint | Expected HTTP Status | Verified System Component |
|---|---|---|---|---|
| 1000 | Create Problem - Anonymous Request | POST /problems | 401 Unauthorized | Session Cookie Firewall (requireAuth) |
| 2000 | Create Problem - Standard User Attempt | POST /problems | 403 Forbidden | Role Privilege Gate (requireAdmin) |
| 3000 | Create Problem - Empty Payload Input | POST /problems | 400 Bad Request | Zod Contract Interceptor |
| 4000 | Create Problem - Bounds Limits Violations | POST /problems | 400 Bad Request | Zod Numeric Min/Max Filters |
| 5000 | Create Problem - Successful Ingestion | POST /problems | 201 Created | Bcrypt / Prisma Ingestion & Auto-Slug Core |
| 6000 | Read Operations - Fetch Active Directory | GET /problems | 200 OK | Array Selection Matrix |
| 7000 | Read Operations - Load Problem Target Specifications | GET /problems/:slug | 200 OK | Slug Lookup Relational Layer |
| 8000 | Read Operations - Query Unregistered Slug | GET /problems/null | 404 Not Found | Service Level Null Catch Boundary |
| 9000 | Update Operations - Apply Structural Mutations | PUT /problems/:publicId | 200 OK | Prisma Update & Dynamic Slug Recalculation |
| 10000 | Soft Delete Operation - Archive Target Challenge | DELETE /problems/:publicId | 200 OK | System Soft-Delete Logic (deletedAt) |
| 11000 | Isolation Verification - Read Soft Deleted Row | GET /problems/:slug | 404 Not Found | Data Isolation Visibility Query Filters |

### 🔍 Verification Audit Conclusion

The testing matrix registers a clean 11/11 PASS standard. Authentication enforcement, role-based authorization, Zod validation boundaries, and soft-delete data isolation all match design patterns perfectly, freezing the problem management subsystem as completely functional.

---

## 7. Core Test Case API Endpoint Catalog

Test case routes are nested sub-resources, mounted under their parent problem via the path prefix `/api/v1/problems/:problemPublicId/test-cases`.

### 1. Batch Upload Test Cases

- **HTTP Method:** `POST`
- **Target Path:** `/problems/:problemPublicId/test-cases/batch`
- **Access Control:** Admin only
- **Description:** Accepts an array of test case objects and ingests them as a single atomic transaction. Resolves the parent problem's `publicId` to its internal numeric `id`, deletes any existing test cases for that problem (`deleteMany`), then inserts the new batch inside a `prisma.$transaction`. If any single insert fails, the entire batch rolls back — no partial or fragmented test data is ever persisted.

**Request Payload Parameters (per test case object):**

| Parameter | Type | Required | Constraints |
|---|---|---|---|
| `input` | String | Required | Evaluation input string, may include literal line breaks (e.g. `[2,7,11,15]\n9`) to simulate stdin. |
| `expectedOutput` | String | Required | Expected output string for evaluation comparison. |
| `isSample` | Boolean | Required | `true` for publicly visible example cases shown in the UI; `false` for hidden evaluation vectors used to blind-test submissions. |
| `score` | Integer | Required | Test case weight. Must be a positive integer (`.int().min(1)`). |

**Sample Input Payload:**

```json
{
  "testCases": [
    {
      "input": "[2,7,11,15]\n9",
      "expectedOutput": "[0,1]",
      "isSample": true,
      "score": 10
    },
    {
      "input": "[3,2,4]\n6",
      "expectedOutput": "[1,2]",
      "isSample": false,
      "score": 20
    }
  ]
}
```

**Behavior Notes:**

- `orderNo` is calculated automatically and is not supplied by the client — it is derived from each item's position in the array (`orderNo: index + 1`), guaranteeing deterministic execution order.
- Re-running this endpoint for the same problem fully overwrites the previous test case set rather than appending to it.

**Success Outflow (201 Created):**

```json
{
  "success": true,
  "message": "Test case batch ingested successfully.",
  "data": {
    "problemPublicId": "e2da157f-1d4e-4f18-a682-1c7c91d4e28a",
    "count": 2
  }
}
```