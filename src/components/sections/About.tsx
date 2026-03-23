import React from 'react'
import Image from 'next/image'

interface AboutProps {
  settings: {
    aboutHeading?: string | null
    aboutText?: { root?: { children?: unknown[] } } | null
    aboutImage?: { url?: string; alt?: string } | null
    businessName?: string | null
  }
}

function renderRichText(content: AboutProps['settings']['aboutText']): string[] {
  if (!content?.root?.children) return []
  return (content.root.children as Array<{ children?: Array<{ text?: string }> }>)
    .map((node) =>
      node.children?.map((child) => child.text || '').join('') || ''
    )
    .filter(Boolean)
}

export function About({ settings }: AboutProps) {
  const { aboutHeading, aboutText, aboutImage, businessName } = settings

  if (!aboutHeading && !aboutText) return null

  const paragraphs = renderRichText(aboutText)

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {aboutHeading || `About ${businessName || 'Us'}`}
            </h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>Learn more about our story and what drives us.</p>
              )}
            </div>
          </div>

          {aboutImage?.url && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={aboutImage.url}
                alt={aboutImage.alt || aboutHeading || 'About us'}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
