import { User as UserInterface } from '@/types/user.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User as UserType, Car, Eye, Edit, Trash2 } from 'lucide-react';

interface UserTableProps {
  users: UserInterface[];
  onView: (user: UserInterface) => void;
  onEdit: (user: UserInterface) => void;
  onDelete: (user: UserInterface) => void;
  loading?: boolean;
}

export const UserTable = ({
  users,
  onView,
  onEdit,
  onDelete,
  loading = false,
}: UserTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden sm:table-cell">Brand</TableHead>
            <TableHead className="hidden md:table-cell">Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <UserType className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{user.email}</div>
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {user.brand ? (
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          <span>{user.brand}</span>
                        </div>
                      ) : (
                        <span>All Brands</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={user.role ? `bg-${user.role} text-blue-500 font-medium` : ''}>
                  {user.role}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {user.brand ? (
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{user.brand}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">All Brands</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(user)}
                    className="p-2 hover:bg-muted rounded-full"
                    aria-label={`View ${user.email}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 hover:bg-muted rounded-full"
                    aria-label={`Edit ${user.email}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-destructive hover:bg-muted rounded-full"
                    aria-label={`Delete ${user.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
