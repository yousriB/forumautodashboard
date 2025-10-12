import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { TestDriveRequest, TestDriveFilters } from '@/types/testDrive';
import { filterTestDriveRequests } from '@/utils/testDriveUtils';
import { SEARCH_DEBOUNCE_DELAY } from '@/constants/testDrive';

export const useTestDriveFilters = (requests: TestDriveRequest[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);
  
  const filters: TestDriveFilters = {
    searchTerm: debouncedSearchTerm,
    statusFilter
  };

  // Memoize filtered requests to avoid recalculating on every render
  const filteredRequests = useMemo(() => {
    return filterTestDriveRequests(requests, filters);
  }, [requests, filters]);

  const updateSearchTerm = (term: string) => {
    setSearchTerm(term);
  };

  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return {
    searchTerm,
    statusFilter,
    filteredRequests,
    updateSearchTerm,
    updateStatusFilter,
    clearFilters,
    hasActiveFilters: searchTerm !== "" || statusFilter !== "all"
  };
};
