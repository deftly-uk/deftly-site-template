import type { Access } from 'payload'

/** Anyone (including unauthenticated visitors) can read. Used for public site content. */
export const anyone: Access = () => true

/** Only authenticated admin users. Used for all writes and for private collections. */
export const adminsOnly: Access = ({ req: { user } }) => Boolean(user)
