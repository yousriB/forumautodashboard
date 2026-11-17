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
      .select('id, email, role, brand, created_at, user_brands(brand)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Impossible de charger les utilisateurs');
    }

    return (data || []).map(({ user_brands, ...u }) => ({
      ...u,
      brands: ((user_brands ?? []) as { brand: string }[]).map((b) => b.brand).sort(),
    })) as User[];
  },

  // ── Create ──────────────────────────────────────────────────────────────────

  async createUser(userData: Omit<UserFormData, 'id'>): Promise<User> {
    const { user } = await callAdminUsers<{ user: User }>({
      action:   'create',
      email:    userData.email,
      password: userData.password,
      role:     userData.role,
      brands:   userData.role === 'sales' ? userData.brands ?? [] : [],
    });
    return user;
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  // 1. role in the profile table (admins only, enforced by RLS)
  // 2. brand list through set_user_brands (admin-only RPC, validates brands
  //    and clears them for non-sales roles)
  // 3. optional new password through the admin-users edge function

  async updateUser(id: string, userData: Partial<UserFormData>): Promise<void> {
    if (userData.role !== undefined) {
      const { error } = await supabase
        .from('users')
        .update({ role: userData.role })
        .eq('id', id)
        .select('id')
        .single();
      if (error) {
        console.error('Error updating user:', error.message);
        throw new Error('Impossible de modifier le rôle');
      }
    }

    if (userData.brands !== undefined || userData.role !== undefined) {
      const { error } = await supabase.rpc('set_user_brands', {
        p_user_id: id,
        p_brands: userData.role === 'sales' || userData.role === undefined ? userData.brands ?? [] : [],
      });
      if (error) {
        console.error('Error updating user brands:', error.message);
        throw new Error('Impossible de modifier les marques attribuées');
      }
    }

    if (userData.password) {
      await callAdminUsers<{ ok: true }>({ action: 'set_password', id, password: userData.password });
    }
  },

  // ── Delete ──────────────────────────────────────────────────────────────────

  async deleteUser(id: string): Promise<void> {
    await callAdminUsers<{ ok: true }>({ action: 'delete', id });
  },
};
