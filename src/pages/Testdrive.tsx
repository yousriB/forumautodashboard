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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye, Car, Phone, Mail, Calendar, Clock, CheckCircle, X } from "lucide-react";

// Types based on your test_drive_requests schema
interface TestDriveRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  car_model: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

// Sample data - replace with actual API calls
const sampleTestDrives: TestDriveRequest[] = [
  {
    id: "TD001",
    full_name: "Alexandra Rodriguez",
    email: "alexandra.rodriguez@email.com",
    phone: "+1 (555) 123-4567",
    car_model: "BMW X5 M50i 2024",
    status: "pending",
    created_at: "2024-01-15T14:30:00Z"
  },
  {
    id: "TD002",
    full_name: "James Mitchell",
    email: "james.mitchell@email.com",
    phone: "+1 (555) 987-6543",
    car_model: "Mercedes-Benz GLC 300",
    status: "confirmed",
    created_at: "2024-01-14T09:15:00Z"
  },
  {
    id: "TD003",
    full_name: "Sophia Chen",
    email: "sophia.chen@email.com",
    phone: "+1 (555) 456-7890",
    car_model: "Audi Q7 Prestige",
    status: "completed",
    created_at: "2024-01-13T16:45:00Z"
  },
  {
    id: "TD004",
    full_name: "Michael Johnson",
    email: "michael.johnson@email.com",
    phone: "+1 (555) 234-5678",
    car_model: "Tesla Model Y Performance",
    status: "pending",
    created_at: "2024-01-12T11:20:00Z"
  },
  {
    id: "TD005",
    full_name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 345-6789",
    car_model: "Lexus RX 350h",
    status: "cancelled",
    created_at: "2024-01-11T13:10:00Z"
  }
];

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const statusIcons = {
  pending: Clock,
  confirmed: Calendar,
  completed: CheckCircle,
  cancelled: X,
};

export default function Testdrive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<TestDriveRequest | null>(null);

  const filteredRequests = sampleTestDrives.filter((request) => {
    const matchesSearch = request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.car_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (requestId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    // In real app, this would be an API call
    const requestIndex = sampleTestDrives.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      sampleTestDrives[requestIndex].status = newStatus;
      // Force re-render by updating state
      setSelectedRequest(null);
      // In a real app, you would also update the state/refetch data
      window.location.reload(); // Temporary solution for demo
    }
  };

  const getStatusCounts = () => {
    return {
      total: sampleTestDrives.length,
      pending: sampleTestDrives.filter(r => r.status === 'pending').length,
      confirmed: sampleTestDrives.filter(r => r.status === 'confirmed').length,
      completed: sampleTestDrives.filter(r => r.status === 'completed').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Test Drive Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage customer test drive requests and schedule appointments
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="dashboard-card p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Requests</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{counts.total}</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{counts.pending}</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-foreground">{counts.confirmed}</p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{counts.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or car model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 input-field"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test Drive Requests Table */}
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Car Model</TableHead>
                  <TableHead className="hidden md:table-cell">Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const StatusIcon = statusIcons[request.status];
                  return (
                    <TableRow key={request.id} className="table-row-hover">
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{request.full_name}</div>
                          <div className="sm:hidden mt-1 space-y-1">
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{request.email}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {request.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{request.email}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.car_model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <div className="text-sm">
                          <div>{new Date(request.created_at).toLocaleDateString()}</div>
                          <div className="text-xs opacity-75">
                            {new Date(request.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl">Test Drive Request Details</DialogTitle>
                                <DialogDescription className="text-sm">
                                  Manage this test drive request
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4 sm:space-y-6">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-3 sm:space-y-4">
                                      <h4 className="font-medium text-foreground text-sm sm:text-base">Customer Information</h4>
                                      <div className="space-y-2 sm:space-y-3">
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Full Name</label>
                                          <p className="font-medium text-sm sm:text-base">{selectedRequest.full_name}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Email</label>
                                          <p className="font-medium text-sm sm:text-base truncate">{selectedRequest.email}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Phone</label>
                                          <p className="font-medium text-sm sm:text-base">{selectedRequest.phone}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3 sm:space-y-4">
                                      <h4 className="font-medium text-foreground text-sm sm:text-base">Request Details</h4>
                                      <div className="space-y-2 sm:space-y-3">
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Car Model</label>
                                          <p className="font-medium text-sm sm:text-base">{selectedRequest.car_model}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Request Date</label>
                                          <p className="font-medium text-sm sm:text-base">
                                            {new Date(selectedRequest.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-xs sm:text-sm text-muted-foreground">Current Status</label>
                                          <div className="mt-1">
                                            <Badge className={`${statusColors[selectedRequest.status]} text-xs sm:text-sm`}>
                                              <StatusIcon className="h-3 w-3 mr-1" />
                                              {selectedRequest.status}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3 border-t pt-4">
                                    <h4 className="font-medium text-foreground text-sm sm:text-base">Quick Actions</h4>
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                      {selectedRequest.status === 'pending' && (
                                        <Button 
                                          onClick={() => {
                                            updateStatus(selectedRequest.id, 'confirmed');
                                            alert('Test drive request confirmed!');
                                          }}
                                          className="flex items-center gap-1 text-sm"
                                        >
                                          <Calendar className="h-4 w-4" />
                                          Confirm Request
                                        </Button>
                                      )}
                                      {selectedRequest.status === 'confirmed' && (
                                        <Button 
                                          onClick={() => {
                                            updateStatus(selectedRequest.id, 'completed');
                                            alert('Test drive marked as completed!');
                                          }}
                                          className="flex items-center gap-1 text-sm"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Mark as Completed
                                        </Button>
                                      )}
                                      <Button variant="outline" asChild className="text-sm">
                                        <a href={`mailto:${selectedRequest.email}?subject=Test Drive Request - ${selectedRequest.car_model}&body=Dear ${selectedRequest.full_name},%0A%0AThank you for your test drive request for the ${selectedRequest.car_model}.%0A%0ABest regards,%0AAutoDealer Team`}>
                                          <Mail className="h-4 w-4 mr-1" />
                                          <span className="hidden sm:inline">Send Email</span>
                                          <span className="sm:hidden">Email</span>
                                        </a>
                                      </Button>
                                      <Button variant="outline" asChild className="text-sm">
                                        <a href={`tel:${selectedRequest.phone}`}>
                                          <Phone className="h-4 w-4 mr-1" />
                                          <span className="hidden sm:inline">Call Customer</span>
                                          <span className="sm:hidden">Call</span>
                                        </a>
                                      </Button>
                                      {(selectedRequest.status === 'pending' || selectedRequest.status === 'confirmed') && (
                                        <Button 
                                          variant="destructive" 
                                          onClick={() => {
                                            if (confirm('Are you sure you want to cancel this test drive request?')) {
                                              updateStatus(selectedRequest.id, 'cancelled');
                                              alert('Test drive request cancelled.');
                                            }
                                          }}
                                          className="flex items-center gap-1 text-sm"
                                        >
                                          <X className="h-4 w-4" />
                                          Cancel Request
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {filteredRequests.length} of {sampleTestDrives.length} requests
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}