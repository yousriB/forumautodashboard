import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Eye,
  FileText,
  Car,
  User,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  CheckCheck,
  Trash,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";

// Standard devis requests
interface DevisRequest {
  id: string;
  car_brand: string;
  car_model: string;
  car_version: string;
  car_price: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  cin_or_nf: string;
  created_at: string;
  note: string;
  status: "pending" | "processing" | "completed" | "rejected" | "sold";
  responded_by: string | null;
  responded_at: string | null;
}

// Custom devis requests
interface CustomDevisRequest {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  cin_or_nf: string;
  email: string;
  car_brand: string;
  car_model: string;
  car_version: string;
  region: string;
  created_at: string;
  note: string;
  status: "pending" | "processing" | "completed" | "rejected" | "sold";
  responded_by: string | null;
  responded_at: string | null;
}

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  processing: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  sold: "bg-[#eab308] text-white",
};

export default function Devis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<
    DevisRequest | CustomDevisRequest | null
  >(null);
  const [requestType, setRequestType] = useState<"standard" | "custom">(
    "standard"
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responsePrice, setResponsePrice] = useState("");
  const [customDevisRequests, setCustomDevisRequests] = useState<
    CustomDevisRequest[]
  >([]);
  const [standardDevisRequests, setStandardDevisRequests] = useState<
    DevisRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [brandFilter, setBrandFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<{
    id: string;
    type: "standard" | "custom";
  } | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<DevisRequest & CustomDevisRequest>>({});

  // Pagination state
  const [standardPage, setStandardPage] = useState(1);
  const [customPage, setCustomPage] = useState(1);
  const itemsPerPage = 10;

  const brands = [
    "ISUZU",
    "CHEVROLET",
    "CHERY",
    "GREAT WALL",
    "HAVAL",
    "GAC",
    "TOYOTA",
    "SUZUKI",
    "MG",
    "FORD",
    "DFSK",
    "DONGFENG",
    "BYD",
    "RENAULT",
    "DACIA",
    "NISSAN",
  ];

  const filterRequests = (requests: any[]) => {
    return requests.filter((request) => {
      const matchesSearch =
        request.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.car_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.car_model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      
      const matchesBrand =
        brandFilter === "all" ||
        request.car_brand.toLowerCase() === brandFilter.toLowerCase();
      
      // Filter by date range
      const requestDate = new Date(request.created_at);
      const matchesDateRange = !dateRange.from || !dateRange.to || 
        (requestDate >= new Date(dateRange.from.setHours(0, 0, 0, 0)) && 
         requestDate <= new Date(dateRange.to.setHours(23, 59, 59, 999)));
      
      return matchesSearch && matchesStatus && matchesBrand && matchesDateRange;
    });
  };

  const viewRequest = (
    request: DevisRequest | CustomDevisRequest,
    type: "standard" | "custom"
  ) => {
    setSelectedRequest(request);
    setRequestType(type);
    setEditedData({ ...request });
    setIsEditing(false);
    setIsViewDialogOpen(true);
  };

  const updateDevisStatus = async (
    requestId: string,
    newStatus: "pending" | "processing" | "completed" | "rejected" | "sold",
    type: "standard" | "custom"
  ) => {
    try {
      setLoading(true);
      const tableName =
        type === "standard" ? "devis_requests" : "custom_devis_requests";
      const { data, error } = await supabase
        .from(tableName)
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
          // You might want to add user ID of the admin who responded
          // responded_by: currentUser?.id
        })
        .eq("id", requestId)
        .select();

      if (error) {
        console.error("Error updating devis status:", error);
        setError("Failed to update devis status");
        return;
      }

      // Update the local state to reflect the change immediately
      if (type === "standard") {
        setStandardDevisRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
      } else {
        setCustomDevisRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
      }

      // Refresh the data from the server to ensure consistency
      if (type === "standard") {
        await fetchStandardDevisRequests();
      } else {
        await fetchCustomDevisRequests();
      }
    } catch (error) {
      console.error("Error updating devis status:", error);
      setError("Failed to update devis status");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomDevisRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("custom_devis_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is a sales rep, only fetch requests for their brand
      if (user?.role === "sales" && user?.brand) {
        query = query.eq("car_brand", user.brand);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching custom devis requests:", error);
        setError("Failed to load custom devis requests");
      } else {
        setCustomDevisRequests(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardDevisRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("devis_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is a sales rep, only fetch requests for their brand
      if (user?.role === "sales" && user?.brand) {
        query = query.eq("car_brand", user.brand);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching standard devis requests:", error);
        setError("Failed to load standard devis requests");
      } else {
        setStandardDevisRequests(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user is loaded
    if (user) {
      fetchStandardDevisRequests();
      fetchCustomDevisRequests();
    }
  }, [user]); // Add user as a dependency

  const filteredDevis = filterRequests(standardDevisRequests);
  const filteredCustomDevis = filterRequests(customDevisRequests);

  // Calculate pagination for standard devis
  const standardPageCount = Math.ceil(filteredDevis.length / itemsPerPage);
  const standardStartIndex = (standardPage - 1) * itemsPerPage;
  const standardEndIndex = standardStartIndex + itemsPerPage;
  const paginatedStandardDevis = filteredDevis.slice(
    standardStartIndex,
    standardEndIndex
  );

  // Calculate pagination for custom devis
  const customPageCount = Math.ceil(filteredCustomDevis.length / itemsPerPage);
  const customStartIndex = (customPage - 1) * itemsPerPage;
  const customEndIndex = customStartIndex + itemsPerPage;
  const paginatedCustomDevis = filteredCustomDevis.slice(
    customStartIndex,
    customEndIndex
  );

  // Reset to first page when filters change
  useEffect(() => {
    setStandardPage(1);
    setCustomPage(1);
  }, [statusFilter, brandFilter, searchTerm, dateRange]);

  const confirmDelete = (id: string, type: "standard" | "custom") => {
    setDeletingRequest({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRequest) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(
          deletingRequest.type === "standard"
            ? "devis_requests"
            : "custom_devis_requests"
        )
        .delete()
        .eq("id", deletingRequest.id);

      if (error) throw error;

      // Update the UI by removing the deleted request
      if (deletingRequest.type === "standard") {
        setStandardDevisRequests((prev) =>
          prev.filter((req) => req.id !== deletingRequest.id)
        );
      } else {
        setCustomDevisRequests((prev) =>
          prev.filter((req) => req.id !== deletingRequest.id)
        );
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      setError("Failed to delete the request. Please try again.");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeletingRequest(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;
    
    try {
      setLoading(true);
      const tableName = requestType === "standard" ? "devis_requests" : "custom_devis_requests";
      
      const { error } = await supabase
        .from(tableName)
        .update(editedData)
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Update the local state
      if (requestType === "standard") {
        setStandardDevisRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id ? { ...req, ...editedData } as DevisRequest : req
          )
        );
      } else {
        setCustomDevisRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id ? { ...req, ...editedData } as CustomDevisRequest : req
          )
        );
      }

      setSelectedRequest(prev => ({ ...prev, ...editedData } as DevisRequest | CustomDevisRequest));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating request:", error);
      setError("Failed to update request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedRequest) {
      setEditedData({ ...selectedRequest });
      setIsEditing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Performa requests
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage customer quote requests and pricing inquiries
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="dashboard-card p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Total Requests
                </p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {standardDevisRequests.length + customDevisRequests.length}
                </p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    [...standardDevisRequests, ...customDevisRequests].filter(
                      (r) => r.status === "pending"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    [...standardDevisRequests, ...customDevisRequests].filter(
                      (r) => r.status === "processing"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="dashboard-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    [...standardDevisRequests, ...customDevisRequests].filter(
                      (r) => r.status === "completed"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or car details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 input-field"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Car className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full hidden sm:w-48 sm:flex justify-start text-left font-normal "
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} -{" "}
                      {format(dateRange.to, "MMM d, y")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, y")
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
              <div className="flex flex-wrap gap-2 p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      from: today,
                      to: today,
                    });
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    setDateRange({
                      from: yesterday,
                      to: yesterday,
                    });
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const last7Days = new Date(today);
                    last7Days.setDate(today.getDate() - 6);
                    setDateRange({
                      from: last7Days,
                      to: today,
                    });
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const last30Days = new Date(today);
                    last30Days.setDate(today.getDate() - 29);
                    setDateRange({
                      from: last30Days,
                      to: today,
                    });
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDateRange({
                      from: undefined,
                      to: undefined,
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for different types */}
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard" className="text-sm">
              Standard Devis
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-sm">
              Custom Devis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            <div className="dashboard-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Vehicle
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Price
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Note
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Date
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStandardDevis.map((request) => (
                      <TableRow key={request.id} className="table-row-hover">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {request.first_name} {request.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              CIN: {request.cin_or_nf}
                            </div>
                            {/* Mobile-only info */}
                            <div className="md:hidden mt-2 space-y-1">
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {request.car_brand} {request.car_model}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {request.car_price}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {request.car_brand} {request.car_model}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.car_version}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {request.car_price}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-[150px]">
                              {request.email}
                            </div>
                            <div className="text-muted-foreground">
                              {request.phone_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell ">
                          {request.note}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewRequest(request, "standard")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={request.status}
                              onValueChange={(
                                value:
                                  | "pending"
                                  | "processing"
                                  | "completed"
                                  | "rejected"
                                  | "sold"
                              ) =>
                                updateDevisStatus(request.id, value, "standard")
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {request.status === 'pending' && (
                                  <>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'processing' && (
                                  <>
                                    <SelectItem value="completed">Complete</SelectItem>
                                    <SelectItem value="sold">Mark as Sold</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'completed' && (
                                  <>
                                    <SelectItem value="sold">Mark as Sold</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'rejected' && (
                                  <SelectItem value="rejected" disabled>Rejected</SelectItem>
                                )}
                                {request.status === 'sold' && (
                                  <SelectItem value="sold" disabled>Sold</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {/* delete button only for admin */}
                            {user.role === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(request.id, "custom");
                                }}
                                disabled={loading}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {standardPageCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium">
                        {standardStartIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(standardEndIndex, filteredDevis.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredDevis.length}
                      </span>{" "}
                      results
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setStandardPage((p) => Math.max(1, p - 1))
                            }
                            className={
                              standardPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from({
                          length: Math.min(5, standardPageCount),
                        }).map((_, i) => {
                          let pageNum;
                          if (standardPageCount <= 5) {
                            pageNum = i + 1;
                          } else if (standardPage <= 3) {
                            pageNum = i + 1;
                          } else if (standardPage >= standardPageCount - 2) {
                            pageNum = standardPageCount - 4 + i;
                          } else {
                            pageNum = standardPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={standardPage === pageNum}
                                onClick={() => setStandardPage(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setStandardPage((p) =>
                                Math.min(standardPageCount, p + 1)
                              )
                            }
                            className={
                              standardPage === standardPageCount
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="dashboard-card">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Vehicle
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Region
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Note
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Date
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomDevis.map((request) => (
                      <TableRow key={request.id} className="table-row-hover">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {request.first_name} {request.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              CIN: {request.cin_or_nf}
                            </div>
                            {/* Mobile-only info */}
                            <div className="md:hidden mt-2 space-y-1">
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {request.car_brand} {request.car_model}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.region}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {request.car_brand} {request.car_model}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.car_version}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="font-medium">{request.region}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-[150px]">
                              {request.email}
                            </div>
                            <div className="text-muted-foreground">
                              {request.phone_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="line-clamp-2">{request.note}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewRequest(request, "custom")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={request.status}
                              onValueChange={(
                                value:
                                  | "pending"
                                  | "processing"
                                  | "completed"
                                  | "rejected"
                                  | "sold"
                              ) =>
                                updateDevisStatus(request.id, value, "custom")
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {request.status === 'pending' && (
                                  <>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'processing' && (
                                  <>
                                    <SelectItem value="completed">Complete</SelectItem>
                                    <SelectItem value="sold">Mark as Sold</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'completed' && (
                                  <>
                                    <SelectItem value="sold">Mark as Sold</SelectItem>
                                    <SelectItem value="rejected">Reject</SelectItem>
                                  </>
                                )}
                                {request.status === 'rejected' && (
                                  <SelectItem value="rejected" disabled>Rejected</SelectItem>
                                )}
                                {request.status === 'sold' && (
                                  <SelectItem value="sold" disabled>Sold</SelectItem>
                                )}
                              </SelectContent>
                            </Select>

                            {/* delete button */}
                            {user.role === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(request.id, "custom");
                                }}
                                disabled={loading}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">{customStartIndex + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(customEndIndex, filteredCustomDevis.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredCustomDevis.length}
                    </span>
                  </div>
                  <Pagination className="flex justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCustomPage((p) => Math.max(1, p - 1))
                          }
                          className={
                            customPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, customPageCount) }).map(
                        (_, i) => {
                          let pageNum;
                          if (customPageCount <= 5) {
                            pageNum = i + 1;
                          } else if (customPage <= 3) {
                            pageNum = i + 1;
                          } else if (customPage >= customPageCount - 2) {
                            pageNum = customPageCount - 4 + i;
                          } else {
                            pageNum = customPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={customPage === pageNum}
                                onClick={() => setCustomPage(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCustomPage((p) =>
                              Math.min(customPageCount, p + 1)
                            )
                          }
                          className={
                            customPage === customPageCount
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Request Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle>Devis Request Details</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Edit' : 'View'} information for this {requestType} devis request
                  </DialogDescription>
                </div>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="mt-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                    Edit
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Full Name
                        </Label>
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editedData.first_name || ''}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                              className="w-full"
                            />
                            <Input
                              value={editedData.last_name || ''}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.first_name}{" "}
                            {selectedRequest.last_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          CIN/NF
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedData.cin_or_nf || ''}
                            onChange={(e) => handleInputChange('cin_or_nf', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.cin_or_nf}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Email
                        </Label>
                        {isEditing ? (
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              value={editedData.email || ''}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        ) : (
                          <p className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedRequest.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Note
                        </Label>
                        {isEditing ? (
                          <textarea
                            value={editedData.note || ''}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                          />
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.note || 'No note provided'}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Phone
                        </Label>
                        {isEditing ? (
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="tel"
                              value={editedData.phone_number || ''}
                              onChange={(e) => handleInputChange('phone_number', e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        ) : (
                          <p className="font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {selectedRequest.phone_number}
                          </p>
                        )}
                      </div>
                      {"region" in selectedRequest && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Region
                          </Label>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedRequest.region}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Brand
                        </Label>
                        {isEditing ? (
                          <Select
                            value={editedData.car_brand || ''}
                            onValueChange={(value) => handleInputChange('car_brand', value)}
                          >
                            <SelectTrigger>
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
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.car_brand}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Model
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedData.car_model || ''}
                            onChange={(e) => handleInputChange('car_model', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.car_model}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Version
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editedData.car_version || ''}
                            onChange={(e) => handleInputChange('car_version', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">
                            {selectedRequest.car_version}
                          </p>
                        )}
                      </div>
                      {"car_price" in selectedRequest && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Price
                          </Label>
                          <p className="font-medium text-lg">
                            {selectedRequest.car_price}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            className={statusColors[selectedRequest.status]}
                          >
                            {selectedRequest.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Request Date
                        </Label>
                        <p className="font-medium">
                          {new Date(
                            selectedRequest.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={handleSaveChanges}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <a
                          href={`mailto:${selectedRequest.email}?subject=Devis Request - ${selectedRequest.car_brand} ${selectedRequest.car_model}`}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={`tel:${selectedRequest.phone_number}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Customer
                        </a>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsEditing(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                request and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>  
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
