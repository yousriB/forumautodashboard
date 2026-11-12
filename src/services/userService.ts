import { User, UserFormData } from '@/types/user.types';
import { supabase } from '@/lib/supabaseClient';

// ─── User Service ─────────────────────────────────────────────────────────────
//   - Authentication (email/password) is handled by Supabase Auth (auth.users)
//   - The public `users` table is a PROFILE table: id, email, role, brand
//   - Creating and deleting accounts needs admin rights on auth.users, so it
//     goes through the `admin-users` edge function, which holds the
//     service-role key server-side and checks the caller is an admin.
//     The service-role key must never be in this browser bundle.

async function callAdminUsers<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: payload });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) message = (await ctx.json()).error ?? message;
    } catch { /* keep default message */ }
    throw new Error(message);
  }
  return data as T;
}

export const userService = {

  // ── Read ────────────────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, brand, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  },

  // ── Create ──────────────────────────────────────────────────────────────────

  async createUser(userData: Omit<UserFormData, 'id'>): Promise<User> {
    const { user } = await callAdminUsers<{ user: User }>({
      action:   'create',
      email:    userData.email,
      password: userData.password,
      role:     userData.role,
      brand:    userData.brand || null,
    });
    return user;
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  // Updates role and brand in the profile table (admins only, enforced by RLS).

  async updateUser(id: string, userData: Partial<UserFormData>): Promise<User> {
    const updateData: Partial<Pick<User, 'role' | 'brand'>> = {};

    if (userData.role  !== undefined) updateData.role  = userData.role;
    if (userData.brand !== undefined) updateData.brand = userData.brand || null;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error.message);
      throw new Error('Failed to update user');
    }

    return data;
  },

  // ── Delete ──────────────────────────────────────────────────────────────────

  async deleteUser(id: string): Promise<void> {
    await callAdminUsers<{ ok: true }>({ action: 'delete', id });
  },
};
