import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { TestDriveRequest } from "@/types/testDrive";
import { fetchTestDriveRequests } from "@/services/testDriveService";
import { filterByBrand } from "@/utils/testDriveUtils";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fetch + manage test drive requests via React Query.
 *
 * Replaces the previous hand-rolled `useState + useEffect` version (and the
 * dead-code sibling `useTestDriveRequests`). Mutations elsewhere call
 * `setRequests` via the returned setter to keep the same API surface as
 * before, but under the hood they're now patching React Query's cache.
 */
export const useTestDriveData = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.testDrives.all;

  const query = useQuery<TestDriveRequest[]>({
    queryKey,
    queryFn: ({ signal }) => fetchTestDriveRequests(signal),
    // Apply the sales-by-brand filter in `select` so the underlying cache
    // stays untouched (admins on another tab still see all rows from the
    // same cache entry).
    select: (data) => {
      if (user?.role === "sales" && user?.brand) {
        return filterByBrand(data, user.brand);
      }
      return data;
    },
  });

  // Imperative setter kept for backwards compatibility with useTestDriveActions.
  // It writes into the cache, which means optimistic UI works without any
  // extra refetch round-trip.
  const setRequests = useCallback<
    React.Dispatch<React.SetStateAction<TestDriveRequest[]>>
  >(
    (updater) => {
      queryClient.setQueryData<TestDriveRequest[]>(queryKey, (old) => {
        const current = old ?? [];
        return typeof updater === "function"
          ? (updater as (prev: TestDriveRequest[]) => TestDriveRequest[])(current)
          : updater;
      });
    },
    [queryClient, queryKey]
  );

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load test drive requests"
      : null,
    refreshData: query.refetch,
    setRequests,
  };
};
