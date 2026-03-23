import React from 'react'

interface ContactProps {
  settings: {
    phone?: string | null
    email?: string | null
    location?: string | null
    businessName?: string | null
  }
}

export function Contact({ settings }: ContactProps) {
  const { phone, email, location, businessName } = settings

  if (!phone && !email && !location) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Get in Touch
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          {`We'd love to hear from you. Reach out to ${businessName || 'us'} using any of the details below.`}
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {phone && (
            <div className="flex flex-col items-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <p className="mt-3 text-sm font-medium">Phone</p>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="mt-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {phone}
              </a>
            </div>
          )}

          {email && (
            <div className="flex flex-col items-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="mt-3 text-sm font-medium">Email</p>
              <a
                href={`mailto:${email}`}
                className="mt-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {email}
              </a>
            </div>
          )}

          {location && (
            <div className="flex flex-col items-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="mt-3 text-sm font-medium">Location</p>
              <p className="mt-1 text-sm text-gray-600">{location}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
