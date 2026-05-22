import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TestDriveRequest, TestDriveStatus } from "@/types/testDrive";
import {
  updateTestDriveStatus,
  deleteTestDriveRequest,
} from "@/services/testDriveService";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Test drive mutations via React Query.
 *
 * Differences from the previous hook:
 *   - No more `useCallback` deps on `requests` — that used to re-create the
 *     handler on every fetch, invalidating any descendant useEffect deps.
 *   - Optimistic update is done by patching the cache via setQueryData
 *     (functional form), so the callback identity stays stable.
 *   - One RPC per status change instead of SELECT+UPDATE(+retry).
 */
export const useTestDriveActions = (
  _requests: TestDriveRequest[], // kept in signature for backwards compatibility
  setRequests: React.Dispatch<React.SetStateAction<TestDriveRequest[]>>,
  setSelectedRequest?: React.Dispatch<React.SetStateAction<TestDriveRequest | null>>
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusMutation = useMutation<
    TestDriveRequest,
    Error,
    { requestId: string; newStatus: TestDriveStatus },
    { previous: TestDriveRequest[] | undefined; optimisticRow?: TestDriveRequest }
  >({
    mutationFn: ({ requestId, newStatus }) => updateTestDriveStatus(requestId, newStatus),
    onMutate: async ({ requestId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.testDrives.all });
      const previous = queryClient.getQueryData<TestDriveRequest[]>(queryKeys.testDrives.all);

      let optimisticRow: TestDriveRequest | undefined;
      setRequests((prev) => {
        const next = prev.map((r) => {
          if (r.id === requestId) {
            optimisticRow = { ...r, status: newStatus };
            return optimisticRow;
          }
          return r;
        });
        return next;
      });

      if (setSelectedRequest && optimisticRow) {
        setSelectedRequest((prev) => (prev?.id === requestId ? optimisticRow : prev));
      }

      return { previous, optimisticRow };
    },
    onSuccess: (updated, _vars) => {
      // Replace the optimistic copy with the canonical row from the server.
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (setSelectedRequest) {
        setSelectedRequest((prev) => (prev?.id === updated.id ? updated : prev));
      }
      toast({
        title: "Status Updated",
        description: `Test drive request ${updated.status} successfully.`,
      });
    },
    onError: (_err, _vars, ctx) => {
      // Roll back
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.testDrives.all, ctx.previous);
        if (setSelectedRequest && ctx.optimisticRow) {
          const original = ctx.previous.find((r) => r.id === ctx.optimisticRow!.id);
          setSelectedRequest((prev) => (prev?.id === ctx.optimisticRow!.id ? original ?? null : prev));
        }
      }
      toast({
        title: "Update Failed",
        description: "Failed to update test drive status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation<
    void,
    Error,
    string,
    { previous: TestDriveRequest[] | undefined }
  >({
    mutationFn: (requestId) => deleteTestDriveRequest(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.testDrives.all });
      const previous = queryClient.getQueryData<TestDriveRequest[]>(queryKeys.testDrives.all);

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (setSelectedRequest) {
        setSelectedRequest((prev) => (prev?.id === requestId ? null : prev));
      }

      return { previous };
    },
    onSuccess: () => {
      toast({
        title: "Request Deleted",
        description: "Test drive request has been deleted successfully.",
      });
    },
    onError: (_err, _requestId, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.testDrives.all, ctx.previous);
      toast({
        title: "Delete Failed",
        description: "Failed to delete test drive request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatus = useCallback(
    async (requestId: string, newStatus: TestDriveStatus): Promise<boolean> => {
      try {
        await statusMutation.mutateAsync({ requestId, newStatus });
        return true;
      } catch {
        return false;
      }
    },
    [statusMutation]
  );

  const confirmRequest = useCallback(
    (requestId: string) => updateStatus(requestId, "confirmed"),
    [updateStatus]
  );

  const completeRequest = useCallback(
    (requestId: string) => updateStatus(requestId, "completed"),
    [updateStatus]
  );

  const cancelRequest = useCallback(
    (requestId: string) => updateStatus(requestId, "cancelled"),
    [updateStatus]
  );

  const deleteRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync(requestId);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  // Mirror the old `isUpdating` shape: the id currently being processed
  // (status mutation takes priority since it's the common case).
  const isUpdating: string | null = statusMutation.isPending
    ? statusMutation.variables?.requestId ?? null
    : deleteMutation.isPending
    ? deleteMutation.variables ?? null
    : null;

  return {
    updateStatus,
    confirmRequest,
    completeRequest,
    cancelRequest,
    deleteRequest,
    isUpdating,
  };
};
