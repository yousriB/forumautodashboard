import { useMemo, useState } from "react";
import { useDebounce } from "./useDebounce";
import { TestDriveRequest, TestDriveFilters } from "@/types/testDrive";
import { filterByBrand, filterTestDriveRequests } from "@/utils/testDriveUtils";
import { SEARCH_DEBOUNCE_DELAY } from "@/constants/testDrive";

export const useTestDriveFilters = (requests: TestDriveRequest[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);

  // Build the filters object inside the memo so the memo isn't invalidated by
  // a fresh object literal on every render (previous bug: filtering ran on
  // every render even when no input changed).
  const filteredRequests = useMemo(() => {
    const filters: TestDriveFilters = {
      searchTerm: debouncedSearchTerm,
      statusFilter,
      brandFilter,
    };
    return filterTestDriveRequests(requests, filters);
  }, [requests, debouncedSearchTerm, statusFilter, brandFilter]);

  // Brand only: feeds the stat cards so counters follow the brand filter.
  const brandFilteredRequests = useMemo(
    () => filterByBrand(requests, brandFilter),
    [requests, brandFilter]
  );

  const updateSearchTerm = (term: string) => {
    setSearchTerm(term);
  };

  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setBrandFilter("all");
  };

  return {
    searchTerm,
    statusFilter,
    brandFilter,
    filteredRequests,
    brandFilteredRequests,
    updateSearchTerm,
    updateStatusFilter,
    updateBrandFilter: setBrandFilter,
    clearFilters,
    hasActiveFilters: searchTerm !== "" || statusFilter !== "all" || brandFilter !== "all",
  };
};
