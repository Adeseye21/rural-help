CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_role" text NOT NULL,
	"scope" jsonb NOT NULL,
	"action" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"grantee_role" text NOT NULL,
	"scope" jsonb NOT NULL,
	"purpose" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"date_of_birth" varchar(10),
	"blood_type" varchar(5),
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_summary" text,
	"emergency_summary_updated_at" timestamp with time zone,
	"share_location" boolean DEFAULT false NOT NULL,
	"allow_emergency_access" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_profiles_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_patient_idx" ON "access_logs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consent_records_patient_idx" ON "consent_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_profiles_patient_idx" ON "patient_profiles" USING btree ("patient_id");