-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "logging";

-- CreateTable
CREATE TABLE "logging"."request_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logging"."error_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "context" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_logs_created_at_idx" ON "logging"."request_logs"("created_at");

-- CreateIndex
CREATE INDEX "request_logs_user_id_idx" ON "logging"."request_logs"("user_id");

-- CreateIndex
CREATE INDEX "error_logs_created_at_idx" ON "logging"."error_logs"("created_at");

-- CreateIndex
CREATE INDEX "error_logs_source_idx" ON "logging"."error_logs"("source");
