import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "cta_call_caption" varchar DEFAULT 'Call us today';
  ALTER TABLE "site_settings" ADD COLUMN "cta_call_label" varchar DEFAULT 'Call now';
  ALTER TABLE "site_settings" ADD COLUMN "cta_quote_label" varchar DEFAULT 'Get a free quote';
  ALTER TABLE "site_settings" ADD COLUMN "not_found_heading" varchar DEFAULT 'Page not found';
  ALTER TABLE "site_settings" ADD COLUMN "not_found_body" varchar DEFAULT 'Sorry, we couldn’t find the page you were looking for.';
  ALTER TABLE "site_settings" ADD COLUMN "not_found_back_label" varchar DEFAULT 'Back to home';
  ALTER TABLE "site_settings" ADD COLUMN "privacy_page_title" varchar DEFAULT 'Privacy Policy';
  ALTER TABLE "home_page" ADD COLUMN "services_eyebrow" varchar DEFAULT 'Our services';
  ALTER TABLE "home_page" ADD COLUMN "about_eyebrow" varchar DEFAULT 'Why choose us';
  ALTER TABLE "home_page" ADD COLUMN "testimonials_eyebrow" varchar DEFAULT 'Reviews';
  ALTER TABLE "home_page" ADD COLUMN "contact_call_prompt" varchar DEFAULT 'Prefer to talk now? Call us:';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "cta_call_caption";
  ALTER TABLE "site_settings" DROP COLUMN "cta_call_label";
  ALTER TABLE "site_settings" DROP COLUMN "cta_quote_label";
  ALTER TABLE "site_settings" DROP COLUMN "not_found_heading";
  ALTER TABLE "site_settings" DROP COLUMN "not_found_body";
  ALTER TABLE "site_settings" DROP COLUMN "not_found_back_label";
  ALTER TABLE "site_settings" DROP COLUMN "privacy_page_title";
  ALTER TABLE "home_page" DROP COLUMN "services_eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "about_eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "testimonials_eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "contact_call_prompt";`)
}
