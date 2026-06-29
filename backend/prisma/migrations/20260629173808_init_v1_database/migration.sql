-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProblemVisibility" AS ENUM ('DRAFT', 'PRIVATE', 'PUBLIC', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('PENDING', 'COMPILING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'SYSTEM_ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(100),
    "avatar_key" TEXT,
    "bio" TEXT,
    "country" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "problems_solved" INTEGER NOT NULL DEFAULT 0,
    "submissions_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "statement" TEXT NOT NULL,
    "input_format" TEXT NOT NULL,
    "output_format" TEXT NOT NULL,
    "constraints_text" TEXT NOT NULL,
    "editorial" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "visibility" "ProblemVisibility" NOT NULL DEFAULT 'DRAFT',
    "time_limit_ms" INTEGER NOT NULL,
    "memory_limit_mb" INTEGER NOT NULL,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "submission_count" INTEGER NOT NULL DEFAULT 0,
    "author_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "language_base" VARCHAR(50) NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "file_extension" VARCHAR(10) NOT NULL,
    "docker_image" TEXT NOT NULL,
    "compile_command" TEXT,
    "run_command" TEXT NOT NULL,
    "is_compiled" BOOLEAN NOT NULL,
    "memory_limit_supported" BOOLEAN NOT NULL DEFAULT true,
    "time_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "execution_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" BIGSERIAL NOT NULL,
    "problem_id" BIGINT NOT NULL,
    "order_no" INTEGER NOT NULL DEFAULT 0,
    "input_data" TEXT,
    "expected_output" TEXT,
    "input_storage_key" TEXT,
    "output_storage_key" TEXT,
    "is_sample" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "problem_id" BIGINT NOT NULL,
    "language_id" BIGINT NOT NULL,
    "source_code" TEXT NOT NULL,
    "verdict" "Verdict" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "execution_time_ms" INTEGER,
    "memory_used_kb" INTEGER,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_tags" (
    "problem_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,

    CONSTRAINT "problem_tags_pkey" PRIMARY KEY ("problem_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "problems_public_id_key" ON "problems"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "problems_slug_idx" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_visibility_idx" ON "problems"("visibility");

-- CreateIndex
CREATE INDEX "problems_author_id_idx" ON "problems"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "languages_public_id_key" ON "languages"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "languages_slug_key" ON "languages"("slug");

-- CreateIndex
CREATE INDEX "languages_slug_idx" ON "languages"("slug");

-- CreateIndex
CREATE INDEX "languages_execution_order_idx" ON "languages"("execution_order");

-- CreateIndex
CREATE INDEX "test_cases_problem_id_idx" ON "test_cases"("problem_id");

-- CreateIndex
CREATE INDEX "test_cases_is_sample_idx" ON "test_cases"("is_sample");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_public_id_key" ON "submissions"("public_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_idx" ON "submissions"("user_id");

-- CreateIndex
CREATE INDEX "submissions_problem_id_idx" ON "submissions"("problem_id");

-- CreateIndex
CREATE INDEX "submissions_verdict_idx" ON "submissions"("verdict");

-- CreateIndex
CREATE INDEX "submissions_language_id_idx" ON "submissions"("language_id");

-- CreateIndex
CREATE INDEX "submissions_submitted_at_idx" ON "submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "problem_tags_tag_id_idx" ON "problem_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_tags" ADD CONSTRAINT "problem_tags_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_tags" ADD CONSTRAINT "problem_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
