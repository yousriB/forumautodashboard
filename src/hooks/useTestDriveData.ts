import { useState, useEffect, useCallback } from 'react';
import { TestDriveRequest } from '@/types/testDrive';
import { fetchTestDriveRequests } from '@/services/testDriveService';

export const useTestDriveData = () => {
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTestDriveRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching test drive requests:', err);
      setError('Failed to load test drive requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    requests,
    isLoading,
    error,
    refreshData,
    setRequests,
  };
};
