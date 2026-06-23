import React from 'react'

/** Light branding of the customer's admin panel (Constitution Article IV). */
export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: '-0.02em',
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 9,
        background: '#173A5E',
        color: '#fff',
        fontSize: 20,
      }}
    >
      D
    </span>
    <span>Deftly CMS</span>
  </div>
)

export default Logo
