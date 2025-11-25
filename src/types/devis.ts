// Base interface for all devis requests
export interface BaseDevisRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  cin_or_nf: string;
  car_brand: string;
  car_model: string;
  car_version: string;
  created_at: string;
  note: string | null;
  status: DevisStatus;
  responded_by: string | null;
  responded_at: string | null;
  processed_at: string | null;
  sold_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  type?: DevisType;
}

// Standard devis request (with price)
export interface StandardDevisRequest extends BaseDevisRequest {
  car_price: string;
}

// Custom devis request (with region)
export interface CustomDevisRequest extends BaseDevisRequest {
  region: string | null;
}

// Union type for all devis requests
export type DevisRequest = StandardDevisRequest | CustomDevisRequest;

// Status types
export type DevisStatus = "pending" | "processing" | "completed" | "rejected" | "sold";
export type DevisType = "standard" | "custom";

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
