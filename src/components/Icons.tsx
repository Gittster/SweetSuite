import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
    </svg>
  )
}

export function ChecklistIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9.5" />
      <polyline points="8 12 11 15 21 5" />
    </svg>
  )
}

export function UtensilsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 2.5v6.5a2.5 2.5 0 0 0 2.5 2.5h1A2.5 2.5 0 0 0 10 9V2.5" />
      <line x1="7" y1="2.5" x2="7" y2="21.5" />
      <path d="M18 2.5c-2 0-3.5 2-3.5 5v4.5a1.5 1.5 0 0 0 1.5 1.5h2v8" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <polyline points="15 5 8 12 15 19" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <polyline points="9 5 16 12 9 19" />
    </svg>
  )
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.3-2-3.4-2.3.8a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a7.6 7.6 0 0 0-2.6 1.5l-2.3-.8-2 3.4 2 1.3a7.6 7.6 0 0 0 0 3l-2 1.3 2 3.4 2.3-.8a7.6 7.6 0 0 0 2.6 1.5l.5 2.6h4l.5-2.6a7.6 7.6 0 0 0 2.6-1.5l2.3.8 2-3.4Z" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={3} {...props}>
      <polyline points="4 12.5 9.5 18 20 6" />
    </svg>
  )
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 3.5h2.3l1 12.2a2 2 0 0 0 2 1.8h8.4a2 2 0 0 0 2-1.7l1.2-7.3H6.2" />
      <circle cx="9" cy="20.5" r="1.4" />
      <circle cx="17" cy="20.5" r="1.4" />
    </svg>
  )
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3.5" width="18" height="17" rx="2.5" />
      <circle cx="8.5" cy="9" r="1.5" />
      <polyline points="21 15.5 15.5 10 5 20" />
    </svg>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4.5 4V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <line x1="7" y1="9.5" x2="17" y2="9.5" />
      <line x1="7" y1="13" x2="13.5" y2="13" />
    </svg>
  )
}

export function PaperclipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11.5 12.4 19a4 4 0 0 1-5.6-5.6L14.5 5.7a2.7 2.7 0 0 1 3.8 3.8l-7.6 7.6a1.3 1.3 0 0 1-1.9-1.9l6.9-6.9" />
    </svg>
  )
}
