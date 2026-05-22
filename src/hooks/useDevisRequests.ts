import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { DevisService } from "@/services/devisService";
import { DevisRequest, DevisResponse, DevisType } from "@/types/devis";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fetch + manage devis requests via React Query.
 *
 * What this hook fixes vs. the old hand-rolled version:
 *   - In-flight dedup: two components mounting with the same key share one
 *     fetch instead of issuing two Supabase requests.
 *   - 30s staleTime (from the global QueryClient defaults) means navigating
 *     Devis → Settings → Devis re-uses the cache instead of refetching.
 *   - Query is cancelled on unmount via the AbortSignal threaded into the
 *     service, so a navigation away no longer counts as an in-flight request
 *     the security logger sees.
 *   - The cache key depends only on primitive user fields, so a new `user`
 *     object reference from TOKEN_REFRESHED no longer invalidates the cache.
 */
export const useDevisRequests = (type: DevisType | "all") => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.devis.list(type, user?.role, user?.brand);

  const query = useQuery<DevisResponse>({
    queryKey,
    queryFn: ({ signal }) =>
      DevisService.fetchRequests(type, undefined, user?.role, user?.brand, signal),
    enabled: !!user,
  });

  // Optimistic local mutators — these patch the cache directly so the UI
  // updates without a refetch. Each mutation hook layered on top of this
  // calls one of these in onMutate / onSuccess.
  const updateRequest = useCallback(
    (id: string, patch: Partial<DevisRequest>) => {
      queryClient.setQueryData<DevisResponse>(queryKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            }
          : old
      );
    },
    [queryClient, queryKey]
  );

  const removeRequest = useCallback(
    (id: string) => {
      queryClient.setQueryData<DevisResponse>(queryKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.filter((r) => r.id !== id),
              count: Math.max(0, (old.count ?? 0) - 1),
            }
          : old
      );
    },
    [queryClient, queryKey]
  );

  const addRequest = useCallback(
    (newRequest: DevisRequest) => {
      queryClient.setQueryData<DevisResponse>(queryKey, (old) =>
        old
          ? {
              ...old,
              data: [newRequest, ...old.data],
              count: (old.count ?? 0) + 1,
            }
          : old
      );
    },
    [queryClient, queryKey]
  );

  return {
    requests: query.data?.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load requests"
      : query.data?.error ?? null,
    fetchRequests: query.refetch,
    refetch: query.refetch,
    updateRequest,
    removeRequest,
    addRequest,
  };
};
