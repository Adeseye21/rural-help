CREATE TYPE "public"."conversation_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"title" text NOT NULL,
	"symptom_text" text NOT NULL,
	"intake_mode" text DEFAULT 'typed' NOT NULL,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"category_ids" jsonb NOT NULL,
	"possible_causes" jsonb NOT NULL,
	"urgency" text DEFAULT 'routine' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"notes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"raw_text" text NOT NULL,
	"explanation" jsonb NOT NULL,
	"clarify_items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"conversation_id" uuid,
	"label" text NOT NULL,
	"instructions" text NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"status" "reminder_status" DEFAULT 'active' NOT NULL,
	"escalation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_documents" ADD CONSTRAINT "health_documents_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_patient_idx" ON "conversations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "health_documents_patient_idx" ON "health_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "reminders_patient_idx" ON "reminders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("next_due_at");