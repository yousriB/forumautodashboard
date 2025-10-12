import { useState, useMemo } from 'react';
import { DevisRequest, FilterOptions } from '@/types/devis';
import { DevisService } from '@/services/devisService';

export const useDevisFilters = (requests: DevisRequest[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Memoized filtered requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      filtered = DevisService.filterRequests(filtered, searchTerm);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Apply brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(request => request.car_brand === brandFilter);
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(request => 
        DevisService.isRequestInDateRange(request, dateRange)
      );
    }

    return filtered;
  }, [requests, searchTerm, statusFilter, brandFilter, dateRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBrandFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      statusFilter !== 'all' ||
      brandFilter !== 'all' ||
      dateRange.from !== undefined
    );
  }, [searchTerm, statusFilter, brandFilter, dateRange.from]);

  // Get current filter options
  const getFilterOptions = (): FilterOptions => ({
    searchTerm: searchTerm || undefined,
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    brandFilter: brandFilter !== 'all' ? brandFilter : undefined,
    dateRange: dateRange.from ? dateRange : undefined,
  });

  return {
    // State
    searchTerm,
    statusFilter,
    brandFilter,
    dateRange,
    
    // Setters
    setSearchTerm,
    setStatusFilter,
    setBrandFilter,
    setDateRange,
    
    // Computed
    filteredRequests,
    hasActiveFilters,
    
    // Actions
    clearFilters,
    getFilterOptions,
  };
};
