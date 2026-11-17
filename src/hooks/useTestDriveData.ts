import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { TestDriveRequest } from "@/types/testDrive";
import { fetchTestDriveRequests } from "@/services/testDriveService";
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
    enabled: !!user,
    // Sales users only receive their assigned brands: row-level security on
    // test_drive_requests filters by car_brand in the database (logout reloads
    // the page, so the cache is never shared between accounts).
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
        : "Impossible de charger les demandes de test drive"
      : null,
    refreshData: query.refetch,
    setRequests,
  };
};
