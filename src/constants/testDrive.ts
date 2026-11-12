import { Clock, Calendar, CheckCircle, X } from "lucide-react";

export const TEST_DRIVE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const STATUS_COLORS = {
  pending: "border-transparent bg-[#f6ebc8] text-[#7a5a0a] hover:bg-[#f6ebc8]",
  confirmed: "border-transparent bg-[#1b1b1a] text-[#d4f75a] hover:bg-[#1b1b1a]",
  completed: "border-transparent bg-[#e6f5c2] text-[#3d5a0c] hover:bg-[#e6f5c2]",
  cancelled: "border-transparent bg-[#fbe2da] text-[#9a3415] hover:bg-[#fbe2da]",
} as const;

export const STATUS_ICONS = {
  pending: Clock,
  confirmed: Calendar,
  completed: CheckCircle,
  cancelled: X,
} as const;

export const SEARCH_DEBOUNCE_DELAY = 300;

export const TABLE_CONSTANTS = {
  MAX_EMAIL_WIDTH: 200,
  MOBILE_BREAKPOINT: 'sm',
  DESKTOP_BREAKPOINT: 'md'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
} as const;
