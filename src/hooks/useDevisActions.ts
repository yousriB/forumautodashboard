import { useState, useCallback } from 'react';
import { DevisService } from '@/services/devisService';
import { DevisRequest, DevisStatus, DevisType } from '@/types/devis';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import { useUser } from "@/context/UserContext";

export const useDevisActions = (
  updateRequest: (id: string, data: Partial<DevisRequest>) => void,
  removeRequest: (id: string) => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    status: DevisStatus,
    type: DevisType
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await DevisService.updateStatus(id, status, type, user?.role === "admin");
      
      if (result.success) {
        // Optimistically update the UI
        updateRequest(id, { status });
      } else {
        setError(result.error || ERROR_MESSAGES.UPDATE_FAILED);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(ERROR_MESSAGES.UPDATE_FAILED);
    } finally {
      setLoading(false);
    }
  }, [updateRequest]);

  const deleteRequest = useCallback(async (id: string, type: DevisType) => {
    try {
      setLoading(true);
      setError(null);

      const result = await DevisService.deleteRequest(id, type);
      
      if (result.success) {
        // Optimistically update the UI
        removeRequest(id);
      } else {
        setError(result.error || ERROR_MESSAGES.DELETE_FAILED);
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(ERROR_MESSAGES.DELETE_FAILED);
    } finally {
      setLoading(false);
    }
  }, [removeRequest]);

  const updateRequestData = useCallback(async (
    id: string,
    data: Partial<DevisRequest>,
    type: DevisType
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await DevisService.updateRequest(id, data, type);
      
      if (result.success) {
        // Optimistically update the UI
        updateRequest(id, data);
      } else {
        setError(result.error || ERROR_MESSAGES.SAVE_FAILED);
      }
    } catch (err) {
      console.error('Error updating request:', err);
      setError(ERROR_MESSAGES.SAVE_FAILED);
    } finally {
      setLoading(false);
    }
  }, [updateRequest]);

  return {
    loading,
    error,
    clearError,
    updateStatus,
    deleteRequest,
    updateRequestData,
  };
};
