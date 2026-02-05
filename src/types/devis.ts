export type DevisType = "standard" | "custom";

export interface DevisRequest {
  id: string;
  type: DevisType;

  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  cin_or_nf: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_version: string | null;
  status: DevisStatus;
  created_at: string;
  note: string | null;

  // Response/Processing fields
  responded_by: string | null;
  responded_at: string | null;
  processed_at: string | null;
  sold_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  payment_mode: string | null;

  // Standard specific
  car_price?: string | null;

  // Custom specific
  region?: string | null;
}

// Status types
export type DevisStatus = "pending" | "processing" | "completed" | "rejected" | "sold";

// Filter options
export interface FilterOptions {
  searchTerm?: string;
  statusFilter?: string;
  brandFilter?: string;
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

// Pagination options
export interface PaginationOptions {
  page: number;
  itemsPerPage: number;
}

// API response types
export interface DevisResponse {
  data: DevisRequest[];
  count: number;
  error?: string;
}

// Status colors mapping
export const STATUS_COLORS = {
  pending: "bg-warning text-warning-foreground",
  processing: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  sold: "bg-[#eab308] text-white",
} as const;

// Status display names
export const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
  sold: "Sold",
} as const;

// Car brands
export const CAR_BRANDS = [
  "ISUZU",
  "CHEVROLET",
  "CHERY",
  "GREAT WALL",
  "HAVAL",
  "GAC",
  "TOYOTA",
  "SUZUKI",
  "MG",
  "FORD",
  "DFSK",
  "DONGFENG"
] as const;

export type CarBrand = typeof CAR_BRANDS[number];
