# AI-Powered Online Judge

An AI-powered Online Judge platform that supports multiple programming languages, automated evaluation, Docker-based sandboxing, AI-assisted learning, coding contests, and interview preparation.

## 🛠️ Tech Stack

* **Next.js** (Frontend Workspace Platform)
* **TypeScript** (Type-Safe Application Layer Framework)
* **Node.js & Express** (Backend REST Routing API Engine)
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
2. **Production-Grade Soft Deletes:** To protect historic submission metadata, core records use a `deleted_at` timestamp rather than hard deletion. Advanced conditional partial unique indexes are bound natively in PostgreSQL to allow new accounts to reuse matching tags once older records drop:
   * `CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;`
   * `CREATE UNIQUE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;`
   * `CREATE UNIQUE INDEX idx_problems_slug_active ON problems(slug) WHERE deleted_at IS NULL;`
3. **Compound High-Concurrency Query Indexing:** High-traffic system lookups are bundled into composite indexes to protect database read channels under scale:
   * `TestCase (problem_id, order_no)`: Prevents random sorting overhead when loading evaluation arrays.
   * `Submission (user_id, problem_id)`: Accelerates performance summary distributions across coding dashboards.
4. **Decoupled Language Compilation Matrix:** All compiler specifications, image environments, build keys, and runtime extensions are stored in an autonomous `languages` table. Onboarding new runtimes requires database inserts rather than code updates.

---

### 📋 Full Relational Schema Map

#### 1. `users`
* `id` (BIGSERIAL, Primary Key)
* `public_id` (UUID, Unique, Default: UUIDv4)
* `username` (VARCHAR(30), Conditional Unique)
* `email` (VARCHAR(255), Conditional Unique)
* `password_hash` (TEXT, Not Null)
* `full_name` (VARCHAR(100), Nullable)
* `avatar_key` (TEXT, Nullable) -> Tracks AWS S3 asset files
* `bio` (TEXT, Nullable)
* `country` (VARCHAR(100), Nullable)
* `role` (ENUM: USER, ADMIN, MODERATOR)
* `problems_solved` (INTEGER, Default: 0)
* `submissions_count` (INTEGER, Default: 0)
* `created_at` / `updated_at` (TIMESTAMPTZ)
* `deleted_at` (TIMESTAMPTZ, Nullable)

#### 2. `problems`
* `id` (BIGSERIAL, Primary Key)
* `public_id` (UUID, Unique)
* `title` (VARCHAR(255))
* `slug` (VARCHAR(255), Conditional Unique) -> Custom dashboard URL paths (/problems/two-sum)
* `statement` (TEXT) -> Supports full Markdown templates, image resources, and LaTeX variables
* `input_format` / `output_format` / `constraints_text` (TEXT)
* `editorial` (TEXT, Nullable)
* `difficulty` (ENUM: EASY, MEDIUM, HARD)
* `visibility` (ENUM: DRAFT, PRIVATE, PUBLIC, ARCHIVED)
* `time_limit_ms` (INTEGER)
* `memory_limit_mb` (INTEGER)
* `accepted_count` / `submission_count` (INTEGER, Default: 0)
* `author_id` (BIGINT, Foreign Key references `users.id`, ON DELETE SET NULL)
* `created_at` / `updated_at` / `deleted_at` (TIMESTAMPTZ)

#### 3. `languages`
* `id` (BIGSERIAL, Primary Key)
* `public_id` (UUID, Unique)
* `name` (VARCHAR(50)) -> (e.g., "C++")
* `display_name` (VARCHAR(100)) -> (e.g., "C++20")
* `slug` (VARCHAR(50), Unique) -> (e.g., "cpp20")
* `language_base` (VARCHAR(50)) -> (e.g., "cpp")
* `version` (VARCHAR(30)) -> (e.g., "20")
* `file_extension` (VARCHAR(10)) -> (e.g., ".cpp")
* `docker_image` (TEXT) -> Isolated compilation target context
* `compile_command` (TEXT, Nullable) -> Target shell command (Null for raw interpreted platforms)
* `run_command` (TEXT) -> Container runtime launch string
* `is_compiled` (BOOLEAN)
* `memory_limit_supported` (BOOLEAN, Default: true)
* `time_multiplier` (FLOAT, Default: 1.0) -> Normalizes performance rules across dynamic stacks
* `execution_order` (INTEGER) -> Preserves manual sorted UI listing ranks
* `is_active` (BOOLEAN, Default: true)
* `created_at` / `updated_at` (TIMESTAMPTZ)

#### 4. `test_cases`
* `id` (BIGSERIAL, Primary Key)
* `problem_id` (BIGINT, Foreign Key references `problems.id`, ON DELETE CASCADE)
* `order_no` (INTEGER, Default: 0) -> Keeps checking arrays sequentially aligned
* `input_data` / `expected_output` (TEXT, Nullable) -> Inline tracking for direct testing values
* `input_storage_key` / `output_storage_key` (TEXT, Nullable) -> AWS S3 object location strings for high-volume data payloads (>50MB)
* `is_sample` (BOOLEAN, Default: false)
* `weight` (INTEGER, Default: 1)
* `created_at` (TIMESTAMPTZ)

#### 5. `submissions`
* `id` (BIGSERIAL, Primary Key)
* `public_id` (UUID, Unique)
* `user_id` (BIGINT, Foreign Key references `users.id`, ON DELETE CASCADE)
* `problem_id` (BIGINT, Foreign Key references `problems.id`, ON DELETE RESTRICT)
* `language_id` (BIGINT, Foreign Key references `languages.id`, ON DELETE RESTRICT)
* `source_code` (TEXT)
* `verdict` (ENUM: PENDING, COMPILING, RUNNING, ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, RUNTIME_ERROR, COMPILATION_ERROR, SYSTEM_ERROR)
* `score` (INTEGER, Nullable)
* `execution_time_ms` (INTEGER, Nullable)
* `memory_used_kb` (INTEGER, Nullable)
* `submitted_at` (TIMESTAMPTZ)

#### 6. `tags`
* `id` (BIGSERIAL, Primary Key)
* `name` (VARCHAR(50), Unique)
* `created_at` (TIMESTAMPTZ)

#### 7. `problem_tags` (Relational Bridge Table)
* `problem_id` (BIGINT, PK, FK references `problems.id`, ON DELETE CASCADE)
* `tag_id` (BIGINT, PK, FK references `tags.id`, ON DELETE CASCADE)