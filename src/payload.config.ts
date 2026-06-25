import path from 'path'
import { fileURLToPath } from 'url'

import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { buildConfig, type Plugin } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Tenants } from './collections/Tenants'
import { Media } from './collections/Media'
import { Services } from './collections/Services'
import { Testimonials } from './collections/Testimonials'
import { Enquiries } from './collections/Enquiries'
import { SiteSettings } from './collections/SiteSettings'
import { HomePage } from './collections/HomePage'
import { isSuperAdmin } from './access/tenant'
import type { Config } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// In tests we run against a throwaway Postgres with no committed migrations, so let
// Payload push the schema straight from this config. Production always uses migrations
// (push:false) so it never hits unmanaged schema drift (BUILD-PLAN known trap).
const pushSchema = process.env.PAYLOAD_DB_PUSH === 'true'

// Shared object store. Real Vercel Blob in production; in dev/test (no token) Payload
// falls back to local disk storage. Either way, media is namespaced per tenant via the
// Media collection's `prefix` field (src/collections/Media.ts).
const storagePlugins: Plugin[] = process.env.BLOB_READ_WRITE_TOKEN
  ? [
      vercelBlobStorage({
        enabled: true,
        collections: {
          media: { disablePayloadAccessControl: true },
        },
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }),
    ]
  : []

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '· Deftly CMS',
    },
    components: {
      // Light branding of the customer's admin panel (Constitution Article IV).
      graphics: {
        Logo: '@/components/admin/Logo#Logo',
        Icon: '@/components/admin/Icon#Icon',
      },
    },
  },
  // Order matters only for admin nav grouping. Tenants + Users are platform-level;
  // the rest are tenant-scoped content (see the multi-tenant plugin config below).
  collections: [Tenants, Users, Media, Services, Testimonials, Enquiries, SiteSettings, HomePage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URI || '',
    },
    push: pushSchema,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  plugins: [
    ...storagePlugins,
    // The keystone: tenant-scopes every content collection, adds the `tenants` array to
    // users, and enforces `{ tenant: { in: <user's tenants> } }` on read/write. Super
    // admins (the Deftly operator) bypass scoping. SiteSettings + HomePage behave as
    // per-tenant globals (one row per tenant).
    multiTenantPlugin<Config>({
      tenantsSlug: 'tenants',
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      collections: {
        media: {},
        services: {},
        testimonials: {},
        enquiries: {},
        'site-settings': { isGlobal: true },
        'home-page': { isGlobal: true },
      },
    }),
  ],
  sharp,
})
