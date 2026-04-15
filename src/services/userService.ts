import { User, UserFormData } from '@/types/user.types';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── User Service ─────────────────────────────────────────────────────────────
// After the Supabase Auth migration:
//   - Authentication (email/password) is handled by Supabase Auth (auth.users)
//   - The public `users` table is now a PROFILE table: id, email, role, brand
//   - Passwords are no longer stored in the public table

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
  // Creates a Supabase Auth account + inserts a matching profile row.
  //
  // ⚠️  Requires "Auto Confirm" to be enabled in your Supabase project:
  //     Dashboard → Authentication → Providers → Email → "Confirm email" OFF
  //     (or the new user won't be active until they confirm their email)

  async createUser(userData: Omit<UserFormData, 'id'>): Promise<User> {
    // Use the admin client so the current admin session is never touched.
    // auth.admin.createUser() creates the auth account server-side without
    // signing the new user in on the current browser.

    // 1. Create the Auth user via admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email:             userData.email,
      password:          userData.password,
      email_confirm:     true,   // skip the confirmation email
      user_metadata: {
        role:  userData.role,
        brand: userData.brand || null,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating Auth user:', authError?.message);
      throw new Error(authError?.message ?? 'Failed to create Auth user');
    }

    // 2. Insert profile row using the same ID as the Auth user.
    //    The `users` table must NOT have a password column.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([{
        id:    authData.user.id,
        email: userData.email,
        role:  userData.role,
        brand: userData.brand || null,
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      throw new Error('Failed to create user profile: ' + profileError.message);
    }

    return profile;
  },

  // ── Update ──────────────────────────────────────────────────────────────────
  // Updates role and brand in the profile table.
  // Password changes must go through Supabase Auth (supabase.auth.updateUser).

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
  // Deletes the auth account (auth.users) AND the profile row (public.users).

  async deleteUser(id: string): Promise<void> {
    // 1. Delete from Supabase Auth using the admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting Auth user:', authError.message);
      throw new Error('Failed to delete auth user: ' + authError.message);
    }

    // 2. Delete the profile row (may already be gone if a DB cascade is set up)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError.message);
      throw new Error('Failed to delete user profile: ' + profileError.message);
    }
  },
};
