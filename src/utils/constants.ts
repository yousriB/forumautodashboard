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
  FETCH_FAILED: 'Impossible de charger les demandes de devis',
  UPDATE_FAILED: 'Impossible de modifier le statut du devis',
  DELETE_FAILED: 'Impossible de supprimer la demande. Veuillez réessayer.',
  SAVE_FAILED: "Impossible d'enregistrer les modifications. Veuillez réessayer.",
  NETWORK_ERROR: 'Erreur réseau. Vérifiez votre connexion.',
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  STATUS_UPDATED: 'Statut mis à jour',
  REQUEST_DELETED: 'Demande supprimée',
  CHANGES_SAVED: 'Modifications enregistrées',
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
