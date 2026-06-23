import Image from 'next/image'
import React from 'react'

import type { HomePage } from '@/payload-types'
import { getImage } from '@/lib/media'
import { RichText } from '@/components/RichText'
import { CheckIcon } from '@/components/icons'

/** About / Why-us — trust-building copy + selling points + a real photo. */
export const About: React.FC<{ home: HomePage }> = ({ home }) => {
  const image = getImage(home.aboutImage, 'feature')
  const points = (home.aboutPoints || []).map((p) => p.text).filter(Boolean)
  const hasBody = Boolean(home.aboutBody)

  if (!hasBody && points.length === 0 && !image) return null

  return (
    <section id="about" className="section bg-[color:var(--color-surface)]">
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className={image ? '' : 'mx-auto max-w-2xl text-center'}>
            <span className="eyebrow">{home.aboutEyebrow || 'Why choose us'}</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {home.aboutHeading || 'Why choose us'}
            </h2>
            {hasBody && <RichText data={home.aboutBody} className="prose-cms mt-5 text-lg" />}

            {points.length > 0 && (
              <ul className={`mt-7 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 ${image ? '' : 'sm:mx-auto sm:max-w-xl sm:text-left'}`}>
                {points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent)]">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-[color:var(--color-ink)]">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {image && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(16,24,40,0.45)]">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default About
