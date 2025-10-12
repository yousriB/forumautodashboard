export type TestDriveStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TestDriveRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  car_model: string;
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
