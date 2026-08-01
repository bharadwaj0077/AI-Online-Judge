/*
  Warnings:

  - You are about to drop the `submissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `problems` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_language_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_problem_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_user_id_fkey";

-- DropIndex
DROP INDEX "problems_slug_idx";

-- DropIndex
DROP INDEX "problems_slug_key";

-- DropIndex
DROP INDEX "test_cases_problem_id_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_username_idx";

-- DropIndex
DROP INDEX "users_username_key";

-- DropTable
DROP TABLE "submissions";

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

-- CreateIndex
CREATE UNIQUE INDEX "submissions_public_id_key" ON "submissions"("public_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_problem_id_idx" ON "submissions"("user_id", "problem_id");

-- CreateIndex
CREATE INDEX "submissions_verdict_idx" ON "submissions"("verdict");

-- CreateIndex
CREATE INDEX "submissions_language_id_idx" ON "submissions"("language_id");

-- CreateIndex
CREATE INDEX "submissions_submitted_at_idx" ON "submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_problems_slug_active" ON "problems"("slug") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE INDEX "test_cases_problem_id_order_no_idx" ON "test_cases"("problem_id", "order_no");

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_email_active" ON "users"("email") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "idx_users_username_active" ON "users"("username") WHERE ("deleted_at" IS NULL);

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
