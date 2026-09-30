CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'declined', 'shared');--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"capability" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"open_hours" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"symptom_text" text NOT NULL,
	"summary" text NOT NULL,
	"possible_causes" jsonb NOT NULL,
	"urgency" text DEFAULT 'routine' NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_requests_patient_idx" ON "review_requests" USING btree ("patient_id");
--> statement-breakpoint
INSERT INTO "facilities" ("name", "type", "capability", "address", "phone", "open_hours", "latitude", "longitude") VALUES
('Obalende Health Centre', 'health_centre', 'General outpatient care, wound dressing, blood pressure checks, antenatal care', 'Obalende village centre, near the primary school', '+234 803 555 0101', 'Monday to Saturday, 8am to 4pm', 6.5244, 3.3792),
('Ise Health Post', 'health_centre', 'Basic outpatient care, malaria testing, immunization, maternal health', 'Ise junction, beside the market', '+234 803 555 0102', 'Monday to Friday, 8am to 5pm', 6.5310, 3.3610),
('Community Pharmacy Ojota', 'pharmacy', 'Medicines, oral rehydration salts, painkillers, first-aid supplies', 'Ojota market road', '+234 803 555 0103', 'Daily, 8am to 8pm', 6.5280, 3.3700),
('Ojota Diagnostic Laboratory', 'laboratory', 'Malaria parasite test, blood sugar test, urine test, pregnancy test', 'Behind the post office, Ojota', '+234 803 555 0104', 'Monday to Saturday, 7am to 6pm', 6.5265, 3.3725),
('Lagos State Ambulance Service (station 4)', 'ambulance', 'Emergency patient transport to hospital', 'Station 4, Ring Road', '199', '24 hours', 6.4500, 3.3900),
('Ikorodu General Hospital', 'hospital', '24-hour emergency care, surgery, maternity, paediatric ward', 'Ikorodu town, hospital road', '+234 803 555 0105', 'Emergency department 24 hours', 6.5010, 3.3550),
('Adire Health Centre', 'health_centre', 'Outpatient care, malaria treatment, child growth monitoring', 'Adire village, near the primary school', '+234 803 555 0106', 'Monday to Friday, 8am to 4pm', 6.5400, 3.3500);
