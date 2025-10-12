import { useState, useEffect, useCallback } from 'react';
import { TestDriveRequest } from '@/types/testDrive';
import { fetchTestDriveRequests } from '@/services/testDriveService';
import { filterByBrand } from '@/utils/testDriveUtils';
import { useUser } from '@/context/UserContext';

export const useTestDriveRequests = () => {
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchTestDriveRequests();
      
      // Filter by brand if user is a salesperson
      let filteredData = data;
      if (user?.role === 'sales' && user?.brand) {
        filteredData = filterByBrand(data, user.brand);
      }
      
      setRequests(filteredData);
    } catch (err) {
      console.error('Error fetching test drives:', err);
      setError('Failed to load test drives. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    requests,
    isLoading,
    error,
    refreshData,
    setRequests
  };
};
