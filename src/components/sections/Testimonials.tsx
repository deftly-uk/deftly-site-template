import React from 'react'

import type { HomePage, Testimonial } from '@/payload-types'
import { Stars } from '@/components/Stars'
import { QuoteIcon } from '@/components/icons'

type Props = { home: HomePage; testimonials: Testimonial[] }

/**
 * Testimonials — manually-entered reviews from the CMS.
 * Display only: never emitted as review/aggregateRating JSON-LD (Google policy).
 */
export const Testimonials: React.FC<Props> = ({ home, testimonials }) => {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section id="reviews" className="section bg-white">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{home.testimonialsEyebrow || 'Reviews'}</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {home.testimonialsHeading || 'What our customers say'}
          </h2>
          {home.testimonialsIntro && (
            <p className="mt-4 text-lg text-[color:var(--color-body)]">{home.testimonialsIntro}</p>
          )}
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id} className="card flex flex-col p-6">
              <QuoteIcon className="h-8 w-8 text-[color:var(--color-accent)]/35" />
              <Stars value={t.rating} className="mt-3" label={`Rated ${t.rating ?? 5} out of 5 stars`} />
              <blockquote className="mt-4 flex-1 text-[color:var(--color-ink)]">
                “{t.quote}”
              </blockquote>
              <footer className="mt-5 border-t border-[color:var(--color-line)] pt-4">
                <p className="font-bold text-[color:var(--color-ink)]">{t.authorName}</p>
                <p className="text-sm text-[color:var(--color-muted)]">
                  {[t.jobType, t.area].filter(Boolean).join(' · ')}
                </p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Testimonials
