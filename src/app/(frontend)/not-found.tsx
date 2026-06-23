import Link from 'next/link'
import React from 'react'

const NotFound = () => (
  <section className="section bg-white">
    <div className="container-x mx-auto max-w-lg text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-extrabold">Page not found</h1>
      <p className="mt-4 text-[color:var(--color-body)]">
        Sorry, we couldn’t find the page you were looking for.
      </p>
      <Link href="/" className="btn btn-accent mt-8">
        Back to home
      </Link>
    </div>
  </section>
)

export default NotFound
