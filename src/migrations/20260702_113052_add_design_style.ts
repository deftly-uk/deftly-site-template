import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_design_style" AS ENUM('reliable', 'friendly', 'emergency');
  ALTER TABLE "site_settings" ALTER COLUMN "cta_quote_label" SET DEFAULT 'Get a quote';
  ALTER TABLE "home_page" ALTER COLUMN "hero_secondary_cta_label" SET DEFAULT 'Get a quote';
  ALTER TABLE "home_page" ALTER COLUMN "contact_heading" SET DEFAULT 'Get a no-obligation quote';
  ALTER TABLE "home_page" ALTER COLUMN "contact_success_message" SET DEFAULT 'Thanks, we''ve got your details and will be in touch shortly.';
  ALTER TABLE "site_settings" ADD COLUMN "design_style" "enum_site_settings_design_style" DEFAULT 'reliable';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "cta_quote_label" SET DEFAULT 'Get a free quote';
  ALTER TABLE "home_page" ALTER COLUMN "hero_secondary_cta_label" SET DEFAULT 'Get a free quote';
  ALTER TABLE "home_page" ALTER COLUMN "contact_heading" SET DEFAULT 'Get a free, no-obligation quote';
  ALTER TABLE "home_page" ALTER COLUMN "contact_success_message" SET DEFAULT 'Thanks — we''ve got your details and will be in touch shortly.';
  ALTER TABLE "site_settings" DROP COLUMN "design_style";
  DROP TYPE "public"."enum_site_settings_design_style";`)
}
