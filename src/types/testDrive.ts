export type TestDriveStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TestDriveRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  car_model: string;
  /** Derived in the database from car_model (trigger test_drive_set_brand). */
  car_brand: string | null;
  status: TestDriveStatus;
  created_at: string;
  updated_at?: string;
}

export interface TestDriveStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface TestDriveFilters {
  searchTerm: string;
  statusFilter: string;
  brandFilter?: string;
}

export interface TestDriveActions {
  updateStatus: (requestId: string, newStatus: TestDriveStatus) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export interface TestDriveState {
  requests: TestDriveRequest[];
  isLoading: boolean;
  error: string | null;
  selectedRequest: TestDriveRequest | null;
  filters: TestDriveFilters;
}
