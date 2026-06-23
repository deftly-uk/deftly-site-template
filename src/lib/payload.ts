import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Single cached Payload instance for the whole app (Article V: thin integration).
 * Every page queries the CMS through this — content is never hardcoded (Article I).
 */
let cached: Promise<Payload> | null = null

export const getPayloadClient = (): Promise<Payload> => {
  if (!cached) {
    cached = getPayload({ config })
  }
  return cached
}
