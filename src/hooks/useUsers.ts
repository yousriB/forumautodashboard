import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user.types";
import { userService } from "@/services/userService";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fetch users via React Query.
 *
 * Mutations in useUserMutations.ts call queryClient.invalidateQueries() with
 * the same key — that's the *only* way users gets refetched now. The
 * `await refetch()` pattern in Users.tsx is gone.
 */
export const useUsers = () => {
  const query = useQuery<User[]>({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getUsers(),
  });

  return {
    users: query.data ?? [],
    loading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch users"
      : null,
    refetch: query.refetch,
  };
};
