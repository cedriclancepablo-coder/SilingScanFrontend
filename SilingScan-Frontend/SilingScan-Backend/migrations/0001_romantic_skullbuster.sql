CREATE TABLE "advisories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(140) NOT NULL,
	"category" varchar(24) NOT NULL,
	"crop" varchar(80) NOT NULL,
	"body" text NOT NULL,
	"author_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"variety" varchar(100) NOT NULL,
	"location" varchar(160) NOT NULL,
	"planted_at" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisories" ADD CONSTRAINT "advisories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "advisories_created_idx" ON "advisories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "crops_owner_idx" ON "crops" USING btree ("user_id","created_at");