import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, UserFormData } from "@/types/user.types";
import { userService } from "@/services/userService";
import { queryKeys } from "@/lib/queryKeys";

type UseUserMutationsReturn = {
  createUser: (userData: Omit<UserFormData, "id">) => Promise<User>;
  updateUser: (id: string, userData: Partial<UserFormData>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
};

/**
 * User mutations via React Query.
 *
 * Replaces the manual `await refetch()` pattern in pages/Users.tsx with cache
 * invalidation — React Query will refetch lazily only if the users query is
 * actually mounted. If the user closes the Users page right after a mutation
 * the refetch is skipped entirely.
 */
export const useUserMutations = (): UseUserMutationsReturn => {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  const createMutation = useMutation<User, Error, Omit<UserFormData, "id">>({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation<
    User,
    Error,
    { id: string; userData: Partial<UserFormData> }
  >({
    mutationFn: ({ id, userData }) => userService.updateUser(id, userData),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: invalidate,
  });

  const createUser = (userData: Omit<UserFormData, "id">) =>
    createMutation.mutateAsync(userData);
  const updateUser = (id: string, userData: Partial<UserFormData>) =>
    updateMutation.mutateAsync({ id, userData });
  const deleteUser = (id: string) => deleteMutation.mutateAsync(id);

  const loading =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error =
    (createMutation.error as Error | null)?.message ??
    (updateMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    null;

  return { createUser, updateUser, deleteUser, loading, error };
};
