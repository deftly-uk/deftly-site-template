import Image from 'next/image'
import React from 'react'

import type { HomePage, Service } from '@/payload-types'
import { getImage } from '@/lib/media'
import { ServiceIcon } from '@/components/icons'

type Props = { home: HomePage; services: Service[] }

/** Services grid — one card per service, all from the Services collection (Article I). */
export const Services: React.FC<Props> = ({ home, services }) => {
  if (!services || services.length === 0) return null

  return (
    <section id="services" className="section bg-white">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{home.servicesEyebrow || 'Our services'}</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {home.servicesHeading || 'What we do'}
          </h2>
          {home.servicesIntro && (
            <p className="mt-4 text-lg text-[color:var(--color-body)]">{home.servicesIntro}</p>
          )}
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const image = getImage(service.image, 'card')
            return (
              <li key={service.id} className="card group overflow-hidden transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]">
                {image ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.alt || service.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  {!image && (
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--color-surface)] text-[color:var(--color-brand)]">
                      <ServiceIcon name={service.icon} className="h-7 w-7" />
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="mt-2 leading-relaxed text-[color:var(--color-body)]">{service.summary}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default Services
