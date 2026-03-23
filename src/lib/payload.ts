import { getPayload as getPayloadInstance } from 'payload'
import configPromise from '@payload-config'

export async function getPayload() {
  return getPayloadInstance({ config: configPromise })
}
