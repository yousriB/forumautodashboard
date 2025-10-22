import { DevisRequest, DevisStatus, STATUS_COLORS, STATUS_LABELS } from "@/types/devis";
import { VALIDATION } from "./constants";

/**
 * Get status color class for styling
 */
export const getStatusColor = (status: DevisStatus): string => {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

/**
 * Get status display label
 */
export const getStatusLabel = (status: DevisStatus): string => {
  return STATUS_LABELS[status] || status;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

/**
 * Get available status transitions based on current status
 */
export const getAvailableStatusTransitions = (
  currentStatus: DevisStatus,
  isAdmin: boolean
): DevisStatus[] => {
  if (isAdmin) {
    return ['pending', 'processing', 'completed', 'sold', 'rejected'];
  }

  switch (currentStatus) {
    case 'pending':
      return ['processing', 'rejected'];
    case 'processing':
      return ['completed', 'sold', 'rejected'];
    case 'completed':
      return ['sold', 'rejected'];
    case 'rejected':
      return []; // No transitions from rejected
    case 'sold':
      return []; // No transitions from sold
    default:
      return [];
  }
};

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (
  currentStatus: DevisStatus, 
  newStatus: DevisStatus,
  isAdmin: boolean
): boolean => {
  return getAvailableStatusTransitions(currentStatus, isAdmin).includes(newStatus);
};

/**
 * Get timestamp for a specific status
 */
export const getStatusTimestamp = (request: DevisRequest, status: DevisStatus): string | null => {
  switch (status) {
    case 'processing':
      return request.processed_at;
    case 'sold':
      return request.sold_at;
    case 'rejected':
      return request.rejected_at;
    case 'completed':
      return request.completed_at;
    default:
      return null;
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Validate name length
 */
export const validateName = (name: string): boolean => {
  return name.length >= VALIDATION.MIN_NAME_LENGTH && name.length <= VALIDATION.MAX_NAME_LENGTH;
};

/**
 * Validate note length
 */
export const validateNote = (note: string): boolean => {
  return note.length <= VALIDATION.MAX_NOTE_LENGTH;
};

/**
 * Get customer full name
 */
export const getCustomerFullName = (request: DevisRequest): string => {
  return `${request.first_name} ${request.last_name}`;
};

/**
 * Get vehicle display name
 */
export const getVehicleDisplayName = (request: DevisRequest): string => {
  return `${request.car_brand} ${request.car_model}`;
};

/**
 * Check if request is recent (within last 24 hours)
 */
export const isRecentRequest = (request: DevisRequest): boolean => {
  const now = new Date();
  const requestDate = new Date(request.created_at);
  const diffInHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
};

/**
 * Get request age in days
 */
export const getRequestAge = (request: DevisRequest): number => {
  const now = new Date();
  const requestDate = new Date(request.created_at);
  const diffInDays = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays;
};

/**
 * Sort requests by latest status date (newest first)
 */
export const sortRequestsByDate = (requests: DevisRequest[]): DevisRequest[] => {
  return [...requests].sort((a, b) => {
    const dateA = getLatestStatusDateObject(a);
    const dateB = getLatestStatusDateObject(b);
    
    // If either date is null, put it at the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });
};

const parseDDMMYYYYHHmmss = (dateString: string): Date | null => {
  const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return null;

  const [, day, month, year, hours, minutes, seconds] = parts;
  // Month is 0-indexed in Date constructor, so subtract 1
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
};

/**
 * Get the latest date object among created_at, processed_at, completed_at, sold_at, rejected_at
 */
export const getLatestStatusDateObject = (request: DevisRequest): Date | null => {
  const dateStrings = [
    request.created_at,
    request.processed_at,
    request.completed_at,
    request.sold_at,
    request.rejected_at,
  ].filter(Boolean) as string[]; // Filter out null/undefined values

  if (dateStrings.length === 0) {
    return null;
  }

  let latestDate: Date | null = null;

  dateStrings.forEach(dateString => {
    let parsedDate: Date | null = null;
    
    // Try parsing as DD/MM/YYYY, HH:mm:ss format first
    parsedDate = parseDDMMYYYYHHmmss(dateString);
    
    if (!parsedDate) {
      // Fallback for ISO strings and other formats
      try {
        parsedDate = new Date(dateString);
        // Check if the date is valid
        if (isNaN(parsedDate.getTime())) {
          parsedDate = null;
        }
      } catch (e) {
        parsedDate = null;
      }
    }

    if (parsedDate && parsedDate.getTime() > 0) {
      if (!latestDate || parsedDate.getTime() > latestDate.getTime()) {
        latestDate = parsedDate;
      }
    }
  });

  return latestDate;
};

/**
 * Get the latest date among created_at, processed_at, completed_at, sold_at, rejected_at
 */
export const getLatestStatusDate = (request: DevisRequest): string => {
  const latestDate = getLatestStatusDateObject(request);
  return latestDate ? formatDate(latestDate.toISOString()) : '';
};

/**
 * Sort requests by status priority
 */
export const sortRequestsByStatus = (requests: DevisRequest[]): DevisRequest[] => {
  const statusPriority = {
    pending: 1,
    processing: 2,
    completed: 3,
    rejected: 4,
    sold: 5,
  };
  
  return [...requests].sort((a, b) => 
    statusPriority[a.status] - statusPriority[b.status]
  );
};

/**
 * Generate mailto link for customer email
 */
export const generateEmailLink = (request: DevisRequest): string => {
  const subject = `Devis Request - ${getVehicleDisplayName(request)}`;
  return `mailto:${request.email}?subject=${encodeURIComponent(subject)}`;
};

/**
 * Generate tel link for customer phone
 */
export const generatePhoneLink = (request: DevisRequest): string => {
  return `tel:${request.phone_number}`;
};
