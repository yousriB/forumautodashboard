import { useMemo, useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Eye, Edit, Trash2, User as UserIcon } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserMutations } from "@/hooks/useUserMutations";
import { useDebounce } from "@/hooks/useDebounce";
import { UserTable } from "@/components/users/UserTable";
import { ViewUserDialog, EditUserDialog, DeleteUserDialog, CreateUserDialog } from "@/components/users/UserDialogs";
import { UserFormData } from "@/components/users/UserForm";
import { User } from "@/types/user.types";
import { useBrands } from "@/lib/brands";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Use custom hooks. We no longer call `refetch()` manually after every
  // mutation — useUserMutations invalidates the ['users'] query, and React
  // Query refetches lazily only if this page is still mounted.
  const { users, loading, error } = useUsers();
  const { toast } = useToast();
  const {
    createUser,
    updateUser,
    deleteUser,
    loading: mutationLoading,
    error: mutationError,
  } = useUserMutations();

  // Debounce the search input + memoise the filter — typing now no longer
  // re-runs the filter on every keystroke, and the filtered array is stable
  // between renders for the table to reconcile cheaply.
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const { labelOf } = useBrands();
  const filteredUsers = useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(q) ||
        user.brands.some((b) => b.toLowerCase().includes(q) || labelOf(b).toLowerCase().includes(q));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearchTerm, roleFilter, labelOf]);

  // Handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateUser = async (formData: UserFormData) => {
    try {
      // Ensure required fields are present
      const userData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        brands: formData.role === "sales" ? formData.brands : [],
      };
      
      await createUser(userData);
      setIsCreateDialogOpen(false);
      toast({ title: "Utilisateur créé", description: formData.email });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Création impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (formData: UserFormData) => {
    if (!selectedUser) return;
    
    try {
      // Only include password if it was provided
      const updateData: Partial<UserFormData> = {
        role: formData.role,
        brands: formData.role === "sales" ? formData.brands : [],
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateUser(selectedUser.id, updateData);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Utilisateur mis à jour", description: formData.email });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Modification impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Utilisateur supprimé" });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Gestion des utilisateurs</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Gérer les comptes, les rôles et les marques attribuées
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 w-full sm:w-auto" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par email ou marque…" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9" 
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="sales">Commercial</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Table */}
        <div className="dashboard-card">
          <UserTable 
            users={filteredUsers}
            loading={loading}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </div>

        {/* Dialogs */}
        {selectedUser && (
          <>
            <ViewUserDialog 
              user={selectedUser}
              open={isViewDialogOpen}
              onOpenChange={setIsViewDialogOpen}
              onEdit={() => {
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
            />

            <EditUserDialog
              user={selectedUser}
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              onSubmit={handleUpdateUser}
              isSubmitting={mutationLoading}
            />

            <DeleteUserDialog
              user={selectedUser}
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              onConfirm={handleConfirmDelete}
              isDeleting={mutationLoading}
            />
          </>
        )}

        <CreateUserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateUser}
          isSubmitting={mutationLoading}
        />
      </div>
    </DashboardLayout>
  );
}