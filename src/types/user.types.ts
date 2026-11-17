export type UserRole = 'admin' | 'sales' | 'support';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  /** Legacy single-brand column (mirror of the first assigned brand). */
  brand?: string | null;
  /** Brands assigned to a sales account (public.user_brands). */
  brands: string[];
  created_at: string;
  updated_at?: string;
}

export interface UserFormData {
  email: string;
  password: string;
  role: UserRole;
  brands: string[];
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  currentUser: User | null;
}

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-500 text-white',
  sales: 'bg-blue-500 text-white',
  support: 'bg-green-500 text-white',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  sales: 'Commercial',
  support: 'Support',
};

// The brand list lives in src/lib/brands.ts (backed by the public.brands table).
