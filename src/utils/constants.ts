// Pagination constants
export const PAGINATION = {
  DEFAULT_ITEMS_PER_PAGE: 10,
  MAX_VISIBLE_PAGES: 5,
} as const;

// UI constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  MAX_SEARCH_LENGTH: 100,
} as const;

// Table constants
export const TABLE = {
  MOBILE_BREAKPOINT: 'md',
  DESKTOP_BREAKPOINT: 'lg',
} as const;

// Date range presets
export const DATE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  CLEAR: 'clear',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to load devis requests',
  UPDATE_FAILED: 'Failed to update devis status',
  DELETE_FAILED: 'Failed to delete the request. Please try again.',
  SAVE_FAILED: 'Failed to save changes. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  STATUS_UPDATED: 'Status updated successfully',
  REQUEST_DELETED: 'Request deleted successfully',
  CHANGES_SAVED: 'Changes saved successfully',
} as const;

// Validation rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_NOTE_LENGTH: 0,
  MAX_NOTE_LENGTH: 500,
} as const;
