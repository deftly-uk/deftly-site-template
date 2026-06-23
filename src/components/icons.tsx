import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
})

export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
)

export const StarIcon = (p: IconProps) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3 1.1-6.47L2.6 9.85l6.5-.95L12 2.5z" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const ShieldCheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const MapPinIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
)

export const QuoteIcon = (p: IconProps) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M7 7h4v4c0 2.5-1.5 4.5-4 5v-2c1.2-.4 2-1.3 2-2.5H7V7Zm8 0h4v4c0 2.5-1.5 4.5-4 5v-2c1.2-.4 2-1.3 2-2.5h-2V7Z" />
  </svg>
)

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const WhatsappIcon = (p: IconProps) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.04-.96.22-3.24-.68-2.74-1.08-4.48-3.88-4.62-4.06-.13-.18-1.1-1.47-1.1-2.8 0-1.32.69-1.97.94-2.24.24-.27.52-.34.7-.34l.5.01c.16 0 .38-.06.59.45.24.58.81 2 .88 2.14.07.14.12.31.02.49-.09.18-.14.29-.27.45l-.4.47c-.13.13-.27.28-.12.54.16.27.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.25.09 1.58.74 1.85.88.27.13.45.2.52.31.07.12.07.66-.17 1.34Z" />
  </svg>
)

export const FacebookIcon = (p: IconProps) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
)

export const InstagramIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
)

// ----------------------------------------------------------------- Service icons

const WrenchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-.6-.6-2.3 2.5-2.7Z" />
  </svg>
)

const FlameIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2s4 3.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.5-2.3C6.8 8.5 6 10.2 6 12a6 6 0 0 0 12 0c0-5-6-10-6-10Z" />
  </svg>
)

const DropletIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 8.7 12 2.5 12 2.5Z" />
  </svg>
)

const RadiatorIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <path d="M7 6v12M11 6v12M15 6v12M3 20h18" />
  </svg>
)

const ShowerIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2M4 12h16" />
    <path d="M9 16v.5M12 16v1M15 16v.5M11 19v.5M14 19v1" />
    <circle cx="16" cy="6" r="2.5" />
  </svg>
)

const GaugeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 14 16 9" />
    <path d="M3.5 18a9 9 0 1 1 17 0" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
  </svg>
)

const BoltIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
)

const SERVICE_ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  wrench: WrenchIcon,
  flame: FlameIcon,
  droplet: DropletIcon,
  radiator: RadiatorIcon,
  shower: ShowerIcon,
  gauge: GaugeIcon,
  shield: ShieldCheckIcon,
  bolt: BoltIcon,
}

export const ServiceIcon = ({
  name,
  ...props
}: { name?: string | null } & Omit<IconProps, 'name'>) => {
  const Cmp = SERVICE_ICONS[name || 'wrench'] || WrenchIcon
  return <Cmp {...props} />
}
