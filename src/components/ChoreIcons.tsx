import type { ComponentType, SVGProps } from 'react'
import type { ChoreIconKey } from '../types'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function DogIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9c0-2 1.5-4 3-4 .8 0 1.3.6 1.5 1.2.5-.3 1-.4 1.5-.4s1 .1 1.5.4C12.7 5.6 13.2 5 14 5c1.5 0 3 2 3 4 0 2.5-1 4-1 4v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3s-1-1.5-1-4Z" />
      <circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.3 13.2h1.4" />
    </svg>
  )
}

function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7" />
      <line x1="10" y1="10.5" x2="10" y2="17" />
      <line x1="14" y1="10.5" x2="14" y2="17" />
    </svg>
  )
}

function DishesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="8.5" rx="7" ry="1.6" />
      <ellipse cx="12" cy="8.5" rx="3.5" ry="0.8" />
      <ellipse cx="12" cy="13.5" rx="7" ry="1.6" />
      <ellipse cx="12" cy="13.5" rx="3.5" ry="0.8" />
      <ellipse cx="12" cy="18.5" rx="7" ry="1.6" />
      <ellipse cx="12" cy="18.5" rx="3.5" ry="0.8" />
    </svg>
  )
}

function BedIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 21v-6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6" />
      <line x1="2" y1="17" x2="22" y2="17" />
      <path d="M4 12V6a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v6" />
      <rect x="7.5" y="9.5" width="6" height="4" rx="1.2" />
    </svg>
  )
}

function BroomIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="15" y1="2" x2="10" y2="13" />
      <path d="M10 13 4 20h10l-2.5-7Z" />
      <line x1="7" y1="20" x2="5" y2="22" />
      <line x1="9.5" y1="20" x2="8" y2="22" />
      <line x1="12" y1="20" x2="11" y2="22" />
    </svg>
  )
}

function ToothIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c-2.5 0-3.5 1.5-5 1.5S4 3.5 4 6.5c0 2 .8 3 1.2 5.5.4 2.5.3 8 2.3 8 1.5 0 1.5-4 2-5.5.3-1 .8-1 1-1s.7 0 1 1c.5 1.5.5 5.5 2 5.5 2 0 1.9-5.5 2.3-8C16.2 9.5 17 8.5 17 6.5 17 3.5 15.5 4.5 14 4.5S14.5 3 12 3Z" />
    </svg>
  )
}

function LaundryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 10h14l-1.5 9.5a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.5L5 10Z" />
      <path d="M4 10h16" />
      <line x1="8.5" y1="10" x2="8.5" y2="16" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="15.5" y1="10" x2="15.5" y2="16" />
      <path d="M9 10c0-2 1-4 3-4s3 2 3 4" />
    </svg>
  )
}

function PlantIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 14h8l-1 7a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1l-1-7Z" />
      <line x1="12" y1="14" x2="12" y2="8" />
      <path d="M12 10c0-2.5-2-4-4.5-3.5C8 9 10 10.5 12 10Z" />
      <path d="M12 8c0-2.5 2-4 4.5-3.5C16 7 14 8.5 12 8Z" />
    </svg>
  )
}

function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.5c-1.5-1-4-1.5-8-1.2v13c4-.3 6.5.2 8 1.2 1.5-1 4-1.5 8-1.2v-13c-4-.3-6.5.2-8 1.2Z" />
      <line x1="12" y1="6.5" x2="12" y2="19.5" />
    </svg>
  )
}

function BackpackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 20v-8a6 6 0 0 1 12 0v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" />
      <path d="M9 12V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V12" />
      <rect x="9" y="14" width="6" height="5" rx="1.5" />
      <line x1="8" y1="8" x2="16" y2="8" />
    </svg>
  )
}

function ShoeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17c0-2 1-3 2.5-3.5L11 11l3-2.5c1-.8 2.3-.5 2.8.6l1 2.4H20a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1Z" />
      <path d="M5.5 13.5 8 17" />
      <path d="M8.5 12.3 10.5 17" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  )
}

function ToyBlocksIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="13" width="6" height="6" rx="1" />
      <rect x="14" y="13" width="6" height="6" rx="1" />
      <rect x="9" y="5" width="6" height="6" rx="1" />
    </svg>
  )
}

function TableSettingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13.5" r="6" />
      <path d="M5 2.5v6a1.8 1.8 0 0 0 1.8 1.8 1.8 1.8 0 0 0 1.8-1.8v-6" />
      <line x1="6.8" y1="2.5" x2="6.8" y2="21" />
      <path d="M19 2.5c-1.7 0-3 2-3 4.5v3a1.3 1.3 0 0 0 1.3 1.3h1.7v9.7" />
    </svg>
  )
}

function BathIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3Z" />
      <path d="M3 12a2 2 0 0 1 2-2" />
      <line x1="6" y1="19" x2="6" y2="21.5" />
      <line x1="18" y1="19" x2="18" y2="21.5" />
      <circle cx="9" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

function DocumentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V7a1 1 0 0 0 1 1h3.5" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function StarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" />
    </svg>
  )
}

export const CHORE_ICONS: Record<ChoreIconKey, ComponentType<IconProps>> = {
  dog: DogIcon,
  trash: TrashIcon,
  dishes: DishesIcon,
  bed: BedIcon,
  broom: BroomIcon,
  tooth: ToothIcon,
  laundry: LaundryIcon,
  plant: PlantIcon,
  book: BookIcon,
  backpack: BackpackIcon,
  shoe: ShoeIcon,
  toyBlocks: ToyBlocksIcon,
  tableSetting: TableSettingIcon,
  bath: BathIcon,
  document: DocumentIcon,
  star: StarIcon,
}

export function ChoreIcon({ icon, ...props }: { icon?: ChoreIconKey } & IconProps) {
  const Icon = CHORE_ICONS[icon ?? 'star']
  return <Icon {...props} />
}
