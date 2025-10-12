import { useMemo } from 'react';
import { TestDriveRequest, TestDriveStats } from '@/types/testDrive';
import { calculateTestDriveStats } from '@/utils/testDriveUtils';

export const useTestDriveStats = (requests: TestDriveRequest[]) => {
  // Memoize stats calculation to avoid recalculating on every render
  const stats = useMemo(() => {
    return calculateTestDriveStats(requests);
  }, [requests]);

  return stats;
};
