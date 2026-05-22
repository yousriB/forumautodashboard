import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { DevisService } from "@/services/devisService";
import { DevisRequest, DevisResponse, DevisStatus, DevisType } from "@/types/devis";
import { ERROR_MESSAGES } from "@/utils/constants";
import { queryKeys } from "@/lib/queryKeys";

type DevisMutators = {
  updateRequest: (id: string, data: Partial<DevisRequest>) => void;
  removeRequest: (id: string) => void;
};

/**
 * Mutation hooks for devis records.
 *
 * Each mutation:
 *   1. Cancels any in-flight queries for the affected key (so a fetch race
 *      doesn't overwrite our optimistic update).
 *   2. Applies the optimistic patch via the cache mutators from
 *      useDevisRequests.
 *   3. Rolls back on error.
 *   4. Invalidates the query on settle so the next read pulls fresh data.
 *
 * The `loading` value the caller still expects now comes from the union of
 * any of the three mutations being pending — preserving the original API.
 */
export const useDevisActions = (
  updateRequest: DevisMutators["updateRequest"],
  removeRequest: DevisMutators["removeRequest"]
) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const updateStatusMutation = useMutation<
    { ok: true; data: DevisRequest } | { ok: false; error: string },
    Error,
    { id: string; status: DevisStatus; type: DevisType },
    { previous?: [readonly unknown[], DevisResponse | undefined][] }
  >({
    mutationFn: async ({ id, status, type }) => {
      const result = await DevisService.updateStatus(id, status, type, isAdmin);
      if (!result.success) return { ok: false, error: result.error || ERROR_MESSAGES.UPDATE_FAILED };
      return { ok: true, data: result.data as DevisRequest };
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.devis.all });
      // Snapshot for rollback
      const previous = queryClient.getQueriesData<DevisResponse>({
        queryKey: queryKeys.devis.all,
      });
      // Optimistic patch via the local mutator (also keeps the existing API)
      updateRequest(id, { status });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (result, { id }) => {
      if (result.ok) {
        // The RPC returns the updated row including new timestamps from the
        // trigger — patch the cache with those.
        updateRequest(id, result.data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis.all });
    },
  });

  const deleteMutation = useMutation<
    { ok: true } | { ok: false; error: string },
    Error,
    { id: string; type: DevisType },
    { previous?: [readonly unknown[], DevisResponse | undefined][] }
  >({
    mutationFn: async ({ id, type }) => {
      const result = await DevisService.deleteRequest(id, type);
      if (!result.success) return { ok: false, error: result.error || ERROR_MESSAGES.DELETE_FAILED };
      return { ok: true };
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.devis.all });
      const previous = queryClient.getQueriesData<DevisResponse>({
        queryKey: queryKeys.devis.all,
      });
      removeRequest(id);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis.all });
    },
  });

  const updateDataMutation = useMutation<
    { ok: true } | { ok: false; error: string },
    Error,
    { id: string; data: Partial<DevisRequest>; type: DevisType },
    { previous?: [readonly unknown[], DevisResponse | undefined][] }
  >({
    mutationFn: async ({ id, data, type }) => {
      const result = await DevisService.updateRequest(id, data, type);
      if (!result.success) return { ok: false, error: result.error || ERROR_MESSAGES.SAVE_FAILED };
      return { ok: true };
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.devis.all });
      const previous = queryClient.getQueriesData<DevisResponse>({
        queryKey: queryKeys.devis.all,
      });
      updateRequest(id, data);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis.all });
    },
  });

  // Public API mirrors the previous hook so callers don't need to change.
  const updateStatus = useCallback(
    async (id: string, status: DevisStatus, type: DevisType) => {
      const result = await updateStatusMutation.mutateAsync({ id, status, type });
      if (result.ok === false) {
        // Surface the error in the state — the caller checks `error`.
        throw new Error(result.error);
      }
    },
    [updateStatusMutation]
  );

  const deleteRequest = useCallback(
    async (id: string, type: DevisType) => {
      const result = await deleteMutation.mutateAsync({ id, type });
      if (result.ok === false) throw new Error(result.error);
    },
    [deleteMutation]
  );

  const updateRequestData = useCallback(
    async (id: string, data: Partial<DevisRequest>, type: DevisType) => {
      const result = await updateDataMutation.mutateAsync({ id, data, type });
      if (result.ok === false) throw new Error(result.error);
    },
    [updateDataMutation]
  );

  const loading =
    updateStatusMutation.isPending ||
    deleteMutation.isPending ||
    updateDataMutation.isPending;

  const error =
    (updateStatusMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    (updateDataMutation.error as Error | null)?.message ??
    null;

  const clearError = useCallback(() => {
    updateStatusMutation.reset();
    deleteMutation.reset();
    updateDataMutation.reset();
  }, [updateStatusMutation, deleteMutation, updateDataMutation]);

  return {
    loading,
    error,
    clearError,
    updateStatus,
    deleteRequest,
    updateRequestData,
  };
};
