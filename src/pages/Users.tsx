import { useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabaseClient";

const brands = [
  "ISUZU", "CHEVROLET", "CHERY", "GREAT WALL", "HAVAL", "GAC",
  "TOYOTA", "SUZUKI", "MG", "FORD", "DFSK", "DONGFENG",
  "BYD", "RENAULT", "DACIA", "NISSAN"
];

interface User {
  id: string;
  email: string;
  role: 'admin' |'sales' | 'support';
  brand?: string | null;
  created_at: string;
}

const roleColors = {
  admin: "bg-red-500 text-white",
  sales: "bg-blue-500 text-white",
  support: "bg-green-500 text-white",
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [editForm, setEditForm] = useState({ email: '', role: 'sales' as User['role'], brand: '' });
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'sales' as User['role'], brand: '' });

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.brand && user.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, brand, created_at")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching users:", error.message);
      else setUsers(data || []);
    };

    fetchUsers();
  }, []);

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

  const handleDelete = async () => {
    if (selectedUser) {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", selectedUser.id);

    if (error) console.error("Error deleting user:", error.message);
    else {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      // Show success message or refresh data
    }
    }
  };

  const handleEdit = async () => {
    if (selectedUser) {
      const { data, error } = await supabase
        .from("users")
        .update({ role: editForm.role, brand: editForm.brand })
        .eq("id", selectedUser.id);

      if (error) console.error("Error updating user:", error.message);
      else {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        // Show success message or refresh data
      }
    }
  };

  const handleCreate = async () => {
    if (createForm.email) {
      const { data, error } = await supabase
        .from("users")
        .insert({ email: createForm.email, password: createForm.password, role: createForm.role, brand: createForm.brand });

      if (error) console.error("Error creating user:", error.message);
      else {
        setIsCreateDialogOpen(false);
        setCreateForm({ email: '', password: '', role: 'sales', brand: '' });
        // Show success message or refresh data
      }
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
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="support">Support</SelectItem>
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
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="edit-email" className="text-sm">Email</Label>
        <Input 
          id="edit-email"
          value={editForm.email} 
          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          placeholder="user@autodealer.com"
          className="text-sm"
        />
      </div>
      
      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="edit-role" className="text-sm">Role</Label>
        <Select 
          value={editForm.role} 
          onValueChange={(value) => setEditForm({ ...editForm, role: value as User["role"], brand: "" })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="support">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show brands only if role === sales */}
      {editForm.role === "sales" && (
        <div className="space-y-2">
          <Label htmlFor="edit-brand" className="text-sm">Brand</Label>
          <Select 
            value={editForm.brand || ""} 
            onValueChange={(value) => setEditForm({ ...editForm, brand: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action Buttons */}
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
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="create-email" className="text-sm">Email</Label>
        <Input 
          id="create-email"
          value={createForm.email} 
          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          placeholder="user@autodealer.com"
          className="text-sm"
        />
      </div>

      {/* Password */}
<div className="space-y-2">
  <Label htmlFor="create-password" className="text-sm">Password</Label>
  <Input 
    id="create-password"
    type="password"
    value={createForm.password || ""}
    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
    placeholder="Enter password"
    className="text-sm"
  />
</div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="create-role" className="text-sm">Role</Label>
        <Select 
          value={createForm.role} 
          onValueChange={(value) => setCreateForm({ ...createForm, role: value as User["role"], brand: "" })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="support">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show brands only if role === sales */}
      {createForm.role === "sales" && (
        <div className="space-y-2">
          <Label htmlFor="create-brand" className="text-sm">Brand</Label>
          <Select 
            value={createForm.brand || ""} 
            onValueChange={(value) => setCreateForm({ ...createForm, brand: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
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