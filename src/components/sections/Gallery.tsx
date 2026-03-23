import React from 'react'
import Image from 'next/image'
import { EmptyState } from '../EmptyState'

interface GalleryItem {
  id: string
  title?: string | null
  image: { url?: string; alt?: string }
  category?: string | null
  description?: string | null
}

interface GalleryProps {
  items: GalleryItem[]
}

export function Gallery({ items }: GalleryProps) {
  if (items.length === 0) {
    return <EmptyState collection="gallery" />
  }

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Our Work
        </h2>

        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl"
            >
              {item.image?.url && (
                <Image
                  src={item.image.url}
                  alt={item.image.alt || item.title || 'Gallery image'}
                  width={600}
                  height={400}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* Hover overlay */}
              {(item.title || item.category) && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.title && (
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                  )}
                  {item.category && (
                    <p className="text-xs text-white/80">{item.category}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
