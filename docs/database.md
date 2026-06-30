# 💾 Database Design & Relational Storage Specification — Online Judge Engine

This document outlines the complete relational data topology, advanced system optimizations, schema schemas, explicit constraints, and entity relationships implemented in **PostgreSQL 16+** using **Prisma ORM**.

---

## 1. Global Data Optimization Enhancements

### Dual-ID Isolation Architecture
The platform isolates internal performance concerns from external data exposure vectors:
* **Internal Performance Tracking (`id`):** Managed strictly as auto-incrementing `BIGINT` tracking fields. Relational database joins, foreign key matching, and primary indexes utilize these numerical keys to achieve highly optimal memory layouts and speed up table join lookups.
* **External API Masking (`public_id`):** Exposed to client applications as immutable, random `UUIDv4` strings. This strategy completely blinds scrapers, preventing record enumeration attacks and obscuring user or submission transaction metrics.

### High-Concurrency Partial Indexes
To protect historical evaluation metrics and maintain strict references, core records utilize production soft deletes via a nullable `deleted_at` timestamp. To ensure that usernames, emails, or challenge URL links can be immediately recycled without namespace collision, conditional partial unique indexes are enforced directly within the database:
* `CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;`
* `CREATE UNIQUE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;`
* `CREATE UNIQUE INDEX idx_problems_slug_active ON problems(slug) WHERE deleted_at IS NULL;`

### Composite Performance Index Arrays
High-frequency application lookup paths are bound into multi-column composite indices to completely bypass runtime linear data scanning and data sorting overhead under massive concurrent submit loads:
* `test_cases (problem_id, order_no)`: Maximizes execution throughput when sequentially reading evaluation vectors for sandboxed execution runners.
* `submissions (user_id, problem_id)`: Speeds up profile metrics by serving instant tracking records to user dashboards.

---

## 2. Enumerated Type (ENUM) Structures

### USER_ROLE
* `USER` (Standard coder profile privileges)
* `ADMIN` (Complete problem CRUD controls and server configuration access)
* `MODERATOR` (Community review and flag mediation permissions)

### DIFFICULTY
* `EASY`
* `MEDIUM`
* `HARD`

### PROBLEM_VISIBILITY
* `DRAFT` (Visible only to the author)
* `PRIVATE` (Accessible only via direct token sharing links or contests)
* `PUBLIC` (Fully visible on open exploration dashboards)
* `ARCHIVED` (Hidden from matching lists but preserves historic code references)

### VERDICT
* `PENDING` (Waiting inside the job queue system)
* `COMPILING` (Undergoing build phase execution within sandboxes)
* `RUNNING` (Evaluating against operational assertion data rows)
* `ACCEPTED` (All verification steps passed successfully)
* `WRONG_ANSWER` (Output token mismatches evaluated data sets)
* `TIME_LIMIT_EXCEEDED` (Thread exceeded baseline runtime rules)
* `MEMORY_LIMIT_EXCEEDED` (Process bloated past assigned memory allocations)
* `RUNTIME_ERROR` (Application thread crashed or issued non-zero exit codes)
* `COMPILATION_ERROR` (Compiler pipeline failed to output executable binaries)
* `SYSTEM_ERROR` (Internal runner sandbox exceptions or filesystem timeouts)

---

## 3. Granular Table Specifications

### 1. `users` Table
Stores user profiles, access controls, and aggregated platform performance statistics.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized row index |
| `public_id` | `UUID` | Unique / Not Null | `gen_random_uuid()` | API visible secure identifier token |
| `username` | `VARCHAR(30)` | Not Null | *None* | Alphanumeric account username handle |
| `email` | `VARCHAR(255)` | Not Null | *None* | Account communications access address |
| `password_hash` | `TEXT` | Not Null | *None* | Secure 12-round Bcrypt salted password string |
| `full_name` | `VARCHAR(100)` | Nullable | `NULL` | Optional real identity naming string |
| `avatar_key` | `TEXT` | Nullable | `NULL` | Storage reference key pointing to AWS S3 profile asset |
| `bio` | `TEXT` | Nullable | `NULL` | Brief user summary narrative string |
| `country` | `VARCHAR(100)` | Nullable | `NULL` | Geographic country origin tracking key |
| `role` | `USER_ROLE` | Enum / Not Null | `USER` | Execution permission clearance tier flags |
| `problems_solved` | `INTEGER` | Not Null | `0` | Running summary tally of unique accepted challenges |
| `submissions_count` | `INTEGER` | Not Null | `0` | Running summary tally of total execution entries |
| `created_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Physical registration tracking clock |
| `updated_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Rolling modification timestamp |
| `deleted_at` | `TIMESTAMPTZ` | Nullable | `NULL` | System soft-delete archival tracking timestamp |

---

### 2. `problems` Table
Tracks competitive coding challenges, runtime execution parameters, and markdown statements.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized problem identifier |
| `public_id` | `UUID` | Unique / Not Null | `gen_random_uuid()` | API visible secure parameter token |
| `title` | `VARCHAR(255)` | Not Null | *None* | Title banner name text |
| `slug` | `VARCHAR(255)` | Not Null | *None* | URL friendly string (e.g., `reverse-linked-list`) |
| `statement` | `TEXT` | Not Null | *None* | Challenge brief supporting Markdown and LaTeX layouts |
| `input_format` | `TEXT` | Not Null | *None* | Standard structural input parameters breakdown |
| `output_format` | `TEXT` | Not Null | *None* | Standard structural expected return breakdown |
| `constraints_text` | `TEXT` | Not Null | *None* | Mathematical bound limitations for algorithms |
| `editorial` | `TEXT` | Nullable | `NULL` | Explanatory solution blueprint guide document |
| `difficulty` | `DIFFICULTY` | Enum / Not Null | `EASY` | Subjective ranking categorization assignment |
| `visibility` | `PROBLEM_VISIBILITY` | Enum / Not Null | `DRAFT` | Live platform accessibility status flag |
| `time_limit_ms` | `INTEGER` | Not Null | `1000` | Allowed CPU runtime duration windows before TLE |
| `memory_limit_mb` | `INTEGER` | Not Null | `256` | Allowed RAM execution storage bounds before MLE |
| `accepted_count` | `INTEGER` | Not Null | `0` | Global summary count of verified solutions |
| `submission_count` | `INTEGER` | Not Null | `0` | Global summary count of total platform code entries |
| `author_id` | `BIGINT` | Foreign Key / Nullable | `NULL` | Reference to creator (`users.id`). Sets `NULL` on delete |
| `created_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Initial database entry timestamp |
| `updated_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Rolling entity modification timestamp |
| `deleted_at` | `TIMESTAMPTZ` | Nullable | `NULL` | Operational problem soft-delete tracking field |

---

### 3. `languages` Table
Decoupled environment configuration registry driving the isolated compilation/execution sandbox engine.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized language runtime marker |
| `public_id` | `UUID` | Unique / Not Null | `gen_random_uuid()` | API visible language entity tracking key |
| `name` | `VARCHAR(50)` | Not Null | *None* | Universal language identifier naming string (e.g., `C++`) |
| `display_name` | `VARCHAR(100)` | Not Null | *None* | Interface dropdown friendly text label (e.g., `C++20 (GCC 13)`) |
| `slug` | `VARCHAR(50)` | Unique / Not Null | *None* | Platform code parsing key (e.g., `cpp20`, `python3`) |
| `language_base` | `VARCHAR(50)` | Not Null | *None* | General ecosystem group code (e.g., `cpp`, `python`) |
| `version` | `VARCHAR(30)` | Not Null | *None* | Exact underlying package distribution build sequence |
| `file_extension` | `VARCHAR(10)` | Not Null | *None* | Extension used when generating code assets (e.g., `.cpp`) |
| `docker_image` | `TEXT` | Not Null | *None* | Target container runtime isolation sandbox image tag |
| `compile_command` | `TEXT` | Nullable | `NULL` | Build command line string (Kept `NULL` for interpreted scripts) |
| `run_command` | `TEXT` | Not Null | *None* | Operational binary execution invocation command string |
| `is_compiled` | `BOOLEAN` | Not Null | `true` | Declares if language requires intermediate build compilation steps |
| `memory_limit_supported`| `BOOLEAN` | Not Null | `true` | Flag identifying if Docker container hardware limits apply |
| `time_multiplier` | `FLOAT` | Not Null | `1.0` | Limit multiplier scaling factor normalizer for slower languages |
| `execution_order` | `INTEGER` | Not Null | *None* | Manual positioning sequence value for client listings |
| `is_active` | `BOOLEAN` | Not Null | `true` | Allows global runtime toggling without schema pruning |
| `created_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Compilation runtime profile ingestion timestamp |
| `updated_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Profile property modifications tracking timestamp |

---

### 4. `test_cases` Table
Stores data vectors used to evaluate and score individual code submissions.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized test case identifier |
| `problem_id` | `BIGINT` | Foreign Key / Not Null | *None* | Relational owner reference pointing directly to `problems.id` |
| `order_no` | `INTEGER` | Not Null | `0` | Execution layout position rank index inside testing matrices |
| `input_data` | `TEXT` | Nullable | `NULL` | Inline test parameters data string (Used for small data sets) |
| `expected_output` | `TEXT` | Nullable | `NULL` | Inline target assertion comparison data string |
| `input_storage_key` | `TEXT` | Nullable | `NULL` | AWS S3 object resource key path holding heavy input blocks |
| `output_storage_key`| `TEXT` | Nullable | `NULL` | AWS S3 object resource key path holding heavy output blocks |
| `is_sample` | `BOOLEAN` | Not Null | `false` | Controls visibility inside front-facing challenge statements |
| `weight` | `INTEGER` | Not Null | `1` | Point score tracking allocation multiplier assigned to checking blocks |
| `created_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Testing entry initialization record tracking time |

---

### 5. `submissions` Table
Maintains granular transaction summaries of code executions evaluated by the judge platform.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized unique submission record row marker |
| `public_id` | `UUID` | Unique / Not Null | `gen_random_uuid()` | API visible secure code execution logging handle token |
| `user_id` | `BIGINT` | Foreign Key / Not Null | *None* | Relational runner identity map link referencing `users.id` |
| `problem_id` | `BIGINT` | Foreign Key / Not Null | *None* | Relational evaluation challenge link referencing `problems.id` |
| `language_id` | `BIGINT` | Foreign Key / Not Null | *None* | Relational runtime environment compiler link referencing `languages.id` |
| `source_code` | `TEXT` | Not Null | *None* | Plaintext snapshot payload string representing submitted solution |
| `verdict` | `VERDICT` | Enum / Not Null | `PENDING` | Real-time state marker reporting grading queue status |
| `score` | `INTEGER` | Nullable | `NULL` | Aggregated scoring metric sum gained across active tests |
| `execution_time_ms`| `INTEGER` | Nullable | `NULL` | Peak computational runtime consumption logged during checks |
| `memory_used_kb` | `INTEGER` | Nullable | `NULL` | Peak hardware RAM consumption profile recorded during execution |
| `submitted_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | High-precision server submission ingestion timestamp clock |

---

### 6. `tags` Table
Maintains challenge tag taxonomy terms (e.g., `Graphs`, `Dynamic Programming`) for clean search indexing.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `id` | `BIGSERIAL` | Primary Key | *Auto-Increment* | Internal optimized classification tag index identifier |
| `name` | `VARCHAR(50)` | Unique / Not Null | *None* | Text classification keyword name token (e.g., `sliding-window`) |
| `created_at` | `TIMESTAMPTZ` | Not Null | `CURRENT_TIMESTAMP` | Classification term generation timestamp record |

---

### 7. `problem_tags` Table
Pure many-to-many junction bridge entity connecting problems to relevant tags.

| Field Name | Data Type | Key / Constraint | Default Value | Field Description |
|---|---|---|---|---|
| `problem_id` | `BIGINT` | Composite PK / FK | *None* | Joint owner constraint key targeting relational `problems.id` |
| `tag_id` | `BIGINT` | Composite PK / FK | *None* | Joint owner constraint key targeting relational `tags.id` |

---

## 4. Operational Entity Cascading and Relational Integrity Rules

The structural connections across tables apply production data mapping rules to enforce reference limits and protect historic submission logs:

* **`users` ──► `problems`**
  * Rule Cardinality: One user can author zero or many problems.
  * Integrity Bound: `ON DELETE SET NULL`. If an author account is deleted, the challenge remains accessible on public dashboards, setting the `author_id` reference to `NULL` to preserve platform continuity.

* **`users` ──► `submissions`**
  * Rule Cardinality: One user can generate zero or many submissions.
  * Integrity Bound: `ON DELETE CASCADE`. If a profile is permanently expunged, all matching submission records are wiped cleanly to satisfy user data deletion bounds.

* **`problems` ──► `test_cases`**
  * Rule Cardinality: One problem contains one or many test cases.
  * Integrity Bound: `ON DELETE CASCADE`. Wiping a coding challenge automatically purges all connected verification data blocks, keeping storage allocations lean.

* **`problems` ──► `submissions`**
  * Rule Cardinality: One problem matches zero or many submissions.
  * Integrity Bound: `ON DELETE RESTRICT`. A challenge cannot be hard deleted if active submission logs depend on its schema record, protecting reporting integrity.

* **`languages` ──► `submissions`**
  * Rule Cardinality: One compiler language config matches zero or many submissions.
  * Integrity Bound: `ON DELETE RESTRICT`. Active system configuration profiles are locked from hard deletions while historic code logs reference their compilation entries.

* **`problems` ───► `problem_tags` ◄─── `tags`**
  * Rule Cardinality: Many-to-Many relational linking bridge.
  * Integrity Bound: `ON DELETE CASCADE` across both nodes. Removing either a standard taxonomy tag or a challenge automatically removes matching record links from the mapping bridge.