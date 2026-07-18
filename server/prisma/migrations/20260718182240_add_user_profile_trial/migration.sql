-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "birthdate" DATE,
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "subscription_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trial_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "weight" DOUBLE PRECISION;
