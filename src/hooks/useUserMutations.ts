import { useState } from 'react';
import { User, UserFormData } from '@/types/user.types';
import { userService } from '@/services/userService';

type UseUserMutationsReturn = {
  createUser: (userData: Omit<UserFormData, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Partial<UserFormData>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export const useUserMutations = (): UseUserMutationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: Omit<UserFormData, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await userService.createUser(userData);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<UserFormData>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userService.updateUser(id, userData);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await userService.deleteUser(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
  };
};
