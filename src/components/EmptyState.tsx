import React from 'react'

interface EmptyStateProps {
  collection: string
  message?: string
}

export function EmptyState({ collection, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg text-gray-500">
        {message || `No ${collection} added yet.`}
      </p>
      <p className="mt-2 text-sm text-gray-400">
        Add them via <a href="/admin" className="underline hover:text-gray-600">/admin</a>
      </p>
    </div>
  )
}
