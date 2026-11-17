import { User as UserInterface } from '@/types/user.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User as UserType, Eye, Edit, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '@/types/user.types';
import { useBrands } from '@/lib/brands';

const BrandChips = ({ user, compact = false }: { user: UserInterface; compact?: boolean }) => {
  const { labelOf } = useBrands();
  if (user.role !== 'sales') {
    return <span className="text-muted-foreground">{user.role === 'admin' ? 'Toutes les marques' : '—'}</span>;
  }
  if (user.brands.length === 0) {
    return <span className="text-destructive">Aucune marque</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {user.brands.map((b) => (
        <Badge key={b} variant="secondary" className={compact ? 'px-1.5 py-0 text-[10px] font-medium' : 'font-medium'}>
          {labelOf(b)}
        </Badge>
      ))}
    </div>
  );
};

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
        Aucun utilisateur trouvé
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="hidden sm:table-cell">Marques</TableHead>
            <TableHead className="hidden md:table-cell">Créé le</TableHead>
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
                      <BrandChips user={user} compact />
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <BrandChips user={user} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(user)}
                    className="p-2 hover:bg-muted rounded-full"
                    aria-label={`Voir ${user.email}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 hover:bg-muted rounded-full"
                    aria-label={`Modifier ${user.email}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-destructive hover:bg-muted rounded-full"
                    aria-label={`Supprimer ${user.email}`}
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
