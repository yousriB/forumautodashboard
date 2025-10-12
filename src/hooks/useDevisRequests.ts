import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { DevisService } from '@/services/devisService';
import { DevisRequest, DevisType, FilterOptions } from '@/types/devis';

export const useDevisRequests = (type: DevisType) => {
  const [requests, setRequests] = useState<DevisRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchRequests = useCallback(async (filters?: FilterOptions) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await DevisService.fetchRequests(
        type,
        filters,
        user.role,
        user.brand
      );

      if (response.error) {
        setError(response.error);
      } else {
        setRequests(response.data);
      }
    } catch (err) {
      console.error(`Error fetching ${type} devis requests:`, err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [type, user]);

  const updateRequest = useCallback((id: string, updatedRequest: Partial<DevisRequest>) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, ...updatedRequest } : req
      )
    );
  }, []);

  const removeRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  const addRequest = useCallback((newRequest: DevisRequest) => {
    setRequests(prev => [newRequest, ...prev]);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    updateRequest,
    removeRequest,
    addRequest,
    refetch: () => fetchRequests(),
  };
};
