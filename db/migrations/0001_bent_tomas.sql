CREATE TABLE "social_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"metric" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_metric_unique" ON "social_stats" USING btree ("platform","metric");