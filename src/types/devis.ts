export type DevisType = "standard" | "custom";

export interface DevisRequest {
  is_first_sale: boolean;
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

// ─── Sales statuses ──────────────────────────────────────────────────────────
// Stored values are unchanged in the database; only the labels changed.
//   pending → Nouveau, processing → En cours, sold → Vente confirmée,
//   completed → Livré, rejected → Annulé
// Workflow: Nouveau → En cours → Vente confirmée → Livré (Annulé at any step).

/** Display order, following the workflow. */
export const STATUS_ORDER: DevisStatus[] = ["pending", "processing", "sold", "completed", "rejected"];

export const STATUS_COLORS: Record<DevisStatus, string> = {
  pending: "border-transparent bg-[#f6ebc8] text-[#7a5a0a] hover:bg-[#f6ebc8]",
  processing: "border-transparent bg-[#e7e7e4] text-[#3a3a36] hover:bg-[#e7e7e4]",
  sold: "border-transparent bg-[#ef1923] text-white hover:bg-[#ef1923]",
  completed: "border-transparent bg-[#e4f0dc] text-[#2f5d24] hover:bg-[#e4f0dc]",
  rejected: "border-transparent bg-[#fbe2da] text-[#9a3415] hover:bg-[#fbe2da]",
};

/** Hex colors for charts and PDF exports (same palette as the badges). */
export const STATUS_HEX: Record<DevisStatus, string> = {
  pending: "#e9c46a",
  processing: "#a3a39c",
  sold: "#ef1923",
  completed: "#9dc183",
  rejected: "#f2b8a8",
};

export const STATUS_LABELS: Record<DevisStatus, string> = {
  pending: "Nouveau",
  processing: "En cours",
  sold: "Vente confirmée",
  completed: "Livré",
  rejected: "Annulé",
};

/** Action wording used in the status menu ("move to …"). */
export const STATUS_ACTIONS: Record<DevisStatus, string> = {
  pending: "Remettre en Nouveau",
  processing: "Passer En cours",
  sold: "Confirmer la vente",
  completed: "Marquer Livré",
  rejected: "Annuler",
};
