import { User, UserFormData } from '@/types/user.types';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  },

  async createUser(userData: Omit<UserFormData, 'id'>): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        brand: userData.brand || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      throw new Error('Failed to create user');
    }

    return data;
  },

  async updateUser(id: string, userData: Partial<UserFormData>): Promise<User> {
    const updateData: any = {
      role: userData.role,
      brand: userData.brand || null,
    };

    if (userData.password) {
      // Hash the password before storing
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

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

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error.message);
      throw new Error('Failed to delete user');
    }
  },
};
