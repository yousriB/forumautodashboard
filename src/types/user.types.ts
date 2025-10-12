export type UserRole = 'admin' | 'sales' | 'support';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  brand?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UserFormData {
  email: string;
  password: string;
  role: UserRole;
  brand: string;
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

export const brands = [
  'ISUZU', 'CHEVROLET', 'CHERY', 'GREAT WALL', 'HAVAL', 'GAC',
  'TOYOTA', 'SUZUKI', 'MG', 'FORD', 'DFSK', 'DONGFENG',
  'BYD', 'RENAULT', 'DACIA', 'NISSAN'
] as const;

export type Brand = typeof brands[number];
