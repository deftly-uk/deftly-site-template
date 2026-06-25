import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_status" AS ENUM('pending', 'active', 'suspended');
  CREATE TYPE "public"."enum_tenants_industry" AS ENUM('plumber', 'electrician', 'roofer', 'other');
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"subdomain" varchar NOT NULL,
  	"custom_domain" varchar,
  	"status" "enum_tenants_status" DEFAULT 'pending' NOT NULL,
  	"industry" "enum_tenants_industry" DEFAULT 'plumber' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL
  );
  
  ALTER TABLE "site_settings" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "site_settings" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "site_settings" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "home_page" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "home_page" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "home_page" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "home_page" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar;
  ALTER TABLE "services" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "testimonials" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "enquiries" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_settings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "home_page_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "tenants_subdomain_idx" ON "tenants" USING btree ("subdomain");
  CREATE UNIQUE INDEX "tenants_custom_domain_idx" ON "tenants" USING btree ("custom_domain");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_settings_fk" FOREIGN KEY ("site_settings_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_home_page_fk" FOREIGN KEY ("home_page_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "services_tenant_idx" ON "services" USING btree ("tenant_id");
  CREATE INDEX "testimonials_tenant_idx" ON "testimonials" USING btree ("tenant_id");
  CREATE INDEX "enquiries_tenant_idx" ON "enquiries" USING btree ("tenant_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_site_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("site_settings_id");
  CREATE INDEX "payload_locked_documents_rels_home_page_id_idx" ON "payload_locked_documents_rels" USING btree ("home_page_id");
  CREATE UNIQUE INDEX "site_settings_tenant_idx" ON "site_settings" USING btree ("tenant_id");
  CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");
  CREATE INDEX "site_settings_created_at_idx" ON "site_settings" USING btree ("created_at");
  CREATE UNIQUE INDEX "home_page_tenant_idx" ON "home_page" USING btree ("tenant_id");
  CREATE INDEX "home_page_updated_at_idx" ON "home_page" USING btree ("updated_at");
  CREATE INDEX "home_page_created_at_idx" ON "home_page" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_tenants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_tenant_id_tenants_id_fk";
  
  ALTER TABLE "services" DROP CONSTRAINT "services_tenant_id_tenants_id_fk";
  
  ALTER TABLE "testimonials" DROP CONSTRAINT "testimonials_tenant_id_tenants_id_fk";
  
  ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_tenant_id_tenants_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_tenant_id_tenants_id_fk";
  
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_tenant_id_tenants_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_settings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_home_page_fk";
  
  DROP INDEX "media_tenant_idx";
  DROP INDEX "services_tenant_idx";
  DROP INDEX "testimonials_tenant_idx";
  DROP INDEX "enquiries_tenant_idx";
  DROP INDEX "site_settings_tenant_idx";
  DROP INDEX "site_settings_updated_at_idx";
  DROP INDEX "site_settings_created_at_idx";
  DROP INDEX "home_page_tenant_idx";
  DROP INDEX "home_page_updated_at_idx";
  DROP INDEX "home_page_created_at_idx";
  DROP INDEX "payload_locked_documents_rels_tenants_id_idx";
  DROP INDEX "payload_locked_documents_rels_site_settings_id_idx";
  DROP INDEX "payload_locked_documents_rels_home_page_id_idx";
  ALTER TABLE "site_settings" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "site_settings" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "site_settings" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "site_settings" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "home_page" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "home_page" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "home_page" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "home_page" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "users" DROP COLUMN "is_super_admin";
  ALTER TABLE "media" DROP COLUMN "tenant_id";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "services" DROP COLUMN "tenant_id";
  ALTER TABLE "testimonials" DROP COLUMN "tenant_id";
  ALTER TABLE "enquiries" DROP COLUMN "tenant_id";
  ALTER TABLE "site_settings" DROP COLUMN "tenant_id";
  ALTER TABLE "home_page" DROP COLUMN "tenant_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tenants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_settings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "home_page_id";
  DROP TYPE "public"."enum_tenants_status";
  DROP TYPE "public"."enum_tenants_industry";`)
}
