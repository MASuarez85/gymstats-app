-- Superseries: columna opcional para agrupar 2+ entries cargadas juntas.
ALTER TABLE "public"."entries" ADD COLUMN "block_id" TEXT;

CREATE INDEX "entries_user_id_block_id_idx" ON "public"."entries"("user_id", "block_id");

-- Múltiples grupos musculares planificados por día: antes era único por
-- (user_id, date), ahora único por (user_id, date, muscle_group).
DROP INDEX "public"."day_plans_user_id_date_key";

CREATE UNIQUE INDEX "day_plans_user_id_date_muscle_group_key" ON "public"."day_plans"("user_id", "date", "muscle_group");

-- Correcciones del usuario sobre lo que detectó la IA en una foto.
CREATE TABLE "public"."vision_corrections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_exercise" TEXT NOT NULL,
    "original_muscle_group" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vision_corrections_user_id_created_at_idx" ON "public"."vision_corrections"("user_id", "created_at");

ALTER TABLE "public"."vision_corrections" ADD CONSTRAINT "vision_corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
