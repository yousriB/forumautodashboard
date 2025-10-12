import { useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Eye, Edit, Trash2, User as UserIcon } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserMutations } from "@/hooks/useUserMutations";
import { UserTable } from "@/components/users/UserTable";
import { ViewUserDialog, EditUserDialog, DeleteUserDialog, CreateUserDialog } from "@/components/users/UserDialogs";
import { UserFormData } from "@/components/users/UserForm";
import { User } from "@/types/user.types";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Use custom hooks
  const { users, loading, error, refetch } = useUsers();
  const { 
    createUser, 
    updateUser, 
    deleteUser, 
    loading: mutationLoading, 
    error: mutationError 
  } = useUserMutations();

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (user.brand && user.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
        brand: formData.brand || null,
      };
      
      await createUser(userData);
      await refetch();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (formData: UserFormData) => {
    if (!selectedUser) return;
    
    try {
      // Only include password if it was provided
      const updateData: any = {
        email: formData.email,
        role: formData.role,
        brand: formData.brand || null,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateUser(selectedUser.id, updateData);
      await refetch();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      await refetch();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage system users, roles, and permissions
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 w-full sm:w-auto" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by email or brand..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9" 
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
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