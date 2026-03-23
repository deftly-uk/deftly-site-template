import React from 'react'
import Image from 'next/image'
import { EmptyState } from '../EmptyState'

interface Service {
  id: string
  title: string
  description?: { root?: { children?: unknown[] } } | null
  image?: { url?: string; alt?: string } | null
  icon?: string | null
}

interface ServicesProps {
  services: Service[]
}

function renderRichText(content: Service['description']): string {
  if (!content?.root?.children) return ''
  return (content.root.children as Array<{ children?: Array<{ text?: string }> }>)
    .map((node) =>
      node.children?.map((child) => child.text || '').join('') || ''
    )
    .join(' ')
}

export function Services({ services }: ServicesProps) {
  if (services.length === 0) {
    return <EmptyState collection="services" />
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Our Services
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {service.image?.url && (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image.url}
                    alt={service.image.alt || service.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                {service.description && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {renderRichText(service.description)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
