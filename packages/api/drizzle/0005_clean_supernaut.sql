ALTER TABLE "patient_profiles" ADD COLUMN "conditions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD COLUMN "medicines" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD COLUMN "allergies" jsonb DEFAULT '[]'::jsonb NOT NULL;