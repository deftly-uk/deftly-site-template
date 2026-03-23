import React from 'react'
import Image from 'next/image'
import { EmptyState } from '../EmptyState'

interface Testimonial {
  id: string
  name: string
  role?: string | null
  quote: string
  rating?: number | null
  image?: { url?: string; alt?: string } | null
}

interface TestimonialsProps {
  testimonials: Testimonial[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) {
    return <EmptyState collection="testimonials" />
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          What Our Clients Say
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.id}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              {testimonial.rating && <StarRating rating={testimonial.rating} />}

              <p className="mt-4 flex-1 text-gray-600 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="mt-6 flex items-center gap-3">
                {testimonial.image?.url && (
                  <Image
                    src={testimonial.image.url}
                    alt={testimonial.image.alt || testimonial.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  {testimonial.role && (
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  )}
                </div>
              </div>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
