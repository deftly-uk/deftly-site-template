import React from 'react'

import { StarIcon } from './icons'

/** Row of star icons (rounded to nearest whole star). Decorative; label carries meaning. */
export const Stars: React.FC<{ value?: number | null; className?: string; size?: number }> = ({
  value,
  className,
  size = 18,
}) => {
  const filled = Math.round(Math.min(5, Math.max(0, value ?? 5)))
  return (
    <span className={`inline-flex items-center gap-0.5 ${className || ''}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          style={{ width: size, height: size }}
          className={i < filled ? 'text-[color:var(--color-star)]' : 'text-slate-300'}
        />
      ))}
    </span>
  )
}

export default Stars
