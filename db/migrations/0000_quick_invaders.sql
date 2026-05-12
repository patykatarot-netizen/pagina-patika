CREATE TYPE "public"."session_status" AS ENUM('pending', 'approved', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_cop" integer NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"customer_email" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"wompi_reference" text,
	"calendar_event_id" text,
	"meet_link" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_wompi_reference_unique" UNIQUE("wompi_reference")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "slot_unique" ON "sessions" USING btree ("service_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "wompi_ref_idx" ON "sessions" USING btree ("wompi_reference");