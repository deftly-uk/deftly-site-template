import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

// Keep the GraphQL playground out of production (reduces attack surface).
export const GET =
  process.env.NODE_ENV === 'production'
    ? async () => new Response('Not found', { status: 404 })
    : GRAPHQL_PLAYGROUND_GET(config)
