import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Media is served from Vercel Blob (Constitution Article III: no images in git).
  // Allow next/image to optimise Blob-hosted URLs.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Payload uses these server-only packages; keep them external to the bundle.
  serverExternalPackages: ['sharp'],
  reactStrictMode: true,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
