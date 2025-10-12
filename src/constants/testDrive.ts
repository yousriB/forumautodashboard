import { Clock, Calendar, CheckCircle, X } from "lucide-react";

export const TEST_DRIVE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const STATUS_COLORS = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground", 
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
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
