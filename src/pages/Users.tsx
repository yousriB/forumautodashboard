import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, Eye, Edit, Trash2, Plus, User, Shield, Car } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_agent' | 'service_advisor';
  brand: string | null;
  created_at: string;
}

const sampleUsers: User[] = [
  { id: "1", email: "admin@autodealer.com", role: "admin", brand: null, created_at: "2024-01-01T08:00:00Z" },
  { id: "2", email: "john.manager@autodealer.com", role: "manager", brand: "BMW", created_at: "2024-01-05T09:30:00Z" },
  { id: "3", email: "sarah.sales@autodealer.com", role: "sales_agent", brand: "Mercedes-Benz", created_at: "2024-01-10T10:15:00Z" },
  { id: "4", email: "mike.sales@autodealer.com", role: "sales_agent", brand: "Audi", created_at: "2024-01-12T14:20:00Z" },
  { id: "5", email: "emma.service@autodealer.com", role: "service_advisor", brand: "Tesla", created_at: "2024-01-15T11:45:00Z" }
];

const roleColors = {
  admin: "bg-red-500 text-white",
  manager: "bg-purple-500 text-white", 
  sales_agent: "bg-blue-500 text-white",
  service_advisor: "bg-green-500 text-white",
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', role: 'sales_agent' as User['role'], brand: '' });
  const [createForm, setCreateForm] = useState({ email: '', role: 'sales_agent' as User['role'], brand: '' });

  const filteredUsers = sampleUsers.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.brand && user.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const viewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({ email: user.email, role: user.role, brand: user.brand || '' });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser) {
      // In real app, this would be an API call
      console.log('Deleting user:', selectedUser.id);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      // Show success message or refresh data
    }
  };

  const handleEdit = () => {
    if (selectedUser) {
      // In real app, this would be an API call
      console.log('Updating user:', selectedUser.id, editForm);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      // Show success message or refresh data
    }
  };

  const handleCreate = () => {
    if (createForm.email) {
      // In real app, this would be an API call
      console.log('Creating user:', createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({ email: '', role: 'sales_agent', brand: '' });
      // Show success message or refresh data
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage system users, roles, and permissions</p>
          </div>
          <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />Add New User
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by email or brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 input-field" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="sales_agent">Sales Agent</SelectItem>
              <SelectItem value="service_advisor">Service Advisor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="dashboard-card">
          <div className="overflow-x-auto">
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
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
                      <Badge className={roleColors[user.role]}>
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
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
                        <Button variant="ghost" size="sm" onClick={() => viewUser(user)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => editUser(user)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirmDelete(user)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">User Details</DialogTitle>
              <DialogDescription className="text-sm">
                View user information and details
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{selectedUser.email}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">User ID: {selectedUser.id}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Role</Label>
                    <div className="mt-1">
                      <Badge className={`${roleColors[selectedUser.role]} text-xs sm:text-sm`}>
                        {selectedUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Brand Access</Label>
                    <p className="mt-1 text-xs sm:text-sm">
                      {selectedUser.brand ? (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3 sm:h-4 sm:w-4" />
                          {selectedUser.brand}
                        </span>
                      ) : (
                        "All Brands"
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Created Date</Label>
                    <p className="mt-1 text-xs sm:text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    editUser(selectedUser);
                  }} className="flex-1 text-sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="text-sm">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
              <DialogDescription className="text-sm">
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm">Email</Label>
                <Input 
                  id="edit-email"
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="user@autodealer.com"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value as User['role']})}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales_agent">Sales Agent</SelectItem>
                    <SelectItem value="service_advisor">Service Advisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-brand" className="text-sm">Brand (Optional)</Label>
                <Input 
                  id="edit-brand"
                  value={editForm.brand} 
                  onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                  placeholder="BMW, Mercedes-Benz, etc."
                  className="text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={handleEdit} className="flex-1 text-sm">Update User</Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-sm">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New User</DialogTitle>
              <DialogDescription className="text-sm">
                Create a new user account for the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email" className="text-sm">Email</Label>
                <Input 
                  id="create-email"
                  value={createForm.email} 
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  placeholder="user@autodealer.com"
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-role" className="text-sm">Role</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({...createForm, role: value as User['role']})}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales_agent">Sales Agent</SelectItem>
                    <SelectItem value="service_advisor">Service Advisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-brand" className="text-sm">Brand (Optional)</Label>
                <Input 
                  id="create-brand"
                  value={createForm.brand} 
                  onChange={(e) => setCreateForm({...createForm, brand: e.target.value})}
                  placeholder="BMW, Mercedes-Benz, etc."
                  className="text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={handleCreate} className="flex-1 text-sm">Create User</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="text-sm">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}