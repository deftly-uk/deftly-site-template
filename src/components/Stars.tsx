import React from 'react'

import { StarIcon } from './icons'

/**
 * Row of star icons (rounded to nearest whole star).
 * Pass `label` to give screen readers a text alternative (so colour/icons are not the
 * only signal); without it the row is decorative and a visible number carries meaning.
 */
export const Stars: React.FC<{
  value?: number | null
  className?: string
  size?: number
  label?: string
}> = ({ value, className, size = 18, label }) => {
  const filled = Math.round(Math.min(5, Math.max(0, value ?? 5)))
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className || ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
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
