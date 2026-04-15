import { User, UserFormData } from '@/types/user.types';
import { supabase } from '@/lib/supabaseClient';

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
    // 1. Create the Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    userData.email,
      password: userData.password,
      options: {
        data: {
          role:  userData.role,
          brand: userData.brand || null,
        },
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating Auth user:', authError?.message);
      throw new Error(authError?.message ?? 'Failed to create Auth user');
    }

    // 2. Insert profile row using the same ID as the Auth user
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([{
        id:    authData.user.id,   // keep ids in sync
        email: userData.email,
        role:  userData.role,
        brand: userData.brand || null,
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      throw new Error('Failed to create user profile');
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
  // Removes the profile row from the public table.
  // The corresponding Auth account must be deleted via the Supabase Dashboard
  // or a service-role Edge Function (client-side anon key cannot delete auth users).

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user profile:', error.message);
      throw new Error('Failed to delete user');
    }
  },
};
