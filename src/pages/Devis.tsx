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
import { Search, Filter, Eye, FileText, Car, User, DollarSign, Mail, Phone, MapPin , CheckCheck} from "lucide-react";
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
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'sold';
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
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'sold';
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
  const [selectedRequest, setSelectedRequest] = useState<DevisRequest | CustomDevisRequest | null>(null);
  const [requestType, setRequestType] = useState<'standard' | 'custom'>('standard');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responsePrice, setResponsePrice] = useState("");
  const [customDevisRequests, setCustomDevisRequests] = useState<CustomDevisRequest[]>([]);
  const [standardDevisRequests, setStandardDevisRequests] = useState<DevisRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [brandFilter, setBrandFilter] = useState("all");

  const brands = [
    "ISUZU", "CHEVROLET", "CHERY", "GREAT WALL", "HAVAL", "GAC",
    "TOYOTA", "SUZUKI", "MG", "FORD", "DFSK", "DONGFENG",
    "BYD", "RENAULT", "DACIA", "NISSAN"
  ];

  const filterRequests = (requests: any[]) => {
    return requests.filter((request) => {
      const matchesSearch = request.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.car_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.car_model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesBrand = brandFilter === "all" || request.car_brand.toLowerCase() === brandFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesBrand;
    });
  };

  const viewRequest = (request: DevisRequest | CustomDevisRequest, type: 'standard' | 'custom') => {
    setSelectedRequest(request);
    setRequestType(type);
    setIsViewDialogOpen(true);
  };


  const updateDevisStatus = async (requestId: string, newStatus: 'pending' | 'processing' | 'completed' | 'rejected' | 'sold', type: 'standard' | 'custom') => {
    try {
      setLoading(true);
      const tableName = type === 'standard' ? 'devis_requests' : 'custom_devis_requests';
      const { data, error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          responded_at: new Date().toISOString(),
          // You might want to add user ID of the admin who responded
          // responded_by: currentUser?.id
          

        })
        .eq('id', requestId)
        .select();

      if (error) {
        console.error('Error updating devis status:', error);
        setError('Failed to update devis status');
        return;
      }

      // Update the local state to reflect the change immediately
      if (type === 'standard') {
        setStandardDevisRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
      } else {
        setCustomDevisRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        );
      }

      // Refresh the data from the server to ensure consistency
      if (type === 'standard') {
        await fetchStandardDevisRequests();
      } else {
        await fetchCustomDevisRequests();
      }

    } catch (error) {
      console.error('Error updating devis status:', error);
      setError('Failed to update devis status');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomDevisRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('custom_devis_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is a sales rep, only fetch requests for their brand
      if (user?.role === 'sales' && user?.brand) {
        query = query.eq('car_brand', user.brand);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching custom devis requests:', error);
        setError('Failed to load custom devis requests');
      } else {
        setCustomDevisRequests(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardDevisRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('devis_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is a sales rep, only fetch requests for their brand
      if (user?.role === 'sales' && user?.brand) {
        query = query.eq('car_brand', user.brand);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching standard devis requests:', error);
        setError('Failed to load standard devis requests');
      } else {
        setStandardDevisRequests(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
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

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-orange-500">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4 bg-black">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Devis Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage customer quote requests and pricing inquiries</p>
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
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Requests</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{standardDevisRequests.length + customDevisRequests.length}</p>
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
                  {[...standardDevisRequests, ...customDevisRequests].filter(r => r.status === 'pending').length}
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
                  {[...standardDevisRequests, ...customDevisRequests].filter(r => r.status === 'processing').length}
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
                  {[...standardDevisRequests, ...customDevisRequests].filter(r => r.status === 'completed').length}
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
            <TabsTrigger value="standard" className="text-sm">Standard Devis</TabsTrigger>
            <TabsTrigger value="custom" className="text-sm">Custom Devis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="space-y-4">
            <div className="dashboard-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                      <TableHead className="hidden lg:table-cell">Price</TableHead>
                      <TableHead className="hidden sm:table-cell">Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevis.map((request) => (
                      <TableRow key={request.id} className="table-row-hover">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{request.first_name} {request.last_name}</div>
                            <div className="text-sm text-muted-foreground">CIN: {request.cin_or_nf}</div>
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
                              <div className="font-medium">{request.car_brand} {request.car_model}</div>
                              <div className="text-sm text-muted-foreground">{request.car_version}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.car_price}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-[150px]">{request.email}</div>
                            <div className="text-muted-foreground">{request.phone_number}</div>
                          </div>
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
                            <Button variant="ghost" size="sm" onClick={() => viewRequest(request, 'standard')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select 
                              value={request.status} 
                              onValueChange={(value: 'pending' | 'processing' | 'completed' | 'rejected' | 'sold') => 
                                updateDevisStatus(request.id, value, 'standard')
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                              </SelectContent>
                            </Select>
                           
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="dashboard-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                      <TableHead className="hidden lg:table-cell">Region</TableHead>
                      <TableHead className="hidden sm:table-cell">Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomDevis.map((request) => (
                      <TableRow key={request.id} className="table-row-hover">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{request.first_name} {request.last_name}</div>
                            <div className="text-sm text-muted-foreground">CIN: {request.cin_or_nf}</div>
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
                              <div className="font-medium">{request.car_brand} {request.car_model}</div>
                              <div className="text-sm text-muted-foreground">{request.car_version}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="font-medium">{request.region}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-[150px]">{request.email}</div>
                            <div className="text-muted-foreground">{request.phone_number}</div>
                          </div>
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
                            <Button variant="ghost" size="sm" onClick={() => viewRequest(request, 'custom')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select 
                              value={request.status} 
                              onValueChange={(value: 'pending' | 'processing' | 'completed' | 'rejected' | 'sold') => 
                                updateDevisStatus(request.id, value, 'custom')
                              }
                              disabled={loading}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Request Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Devis Request Details</DialogTitle>
              <DialogDescription>
                View complete information for this {requestType} devis request
              </DialogDescription>
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
                        <Label className="text-sm text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">CIN/NF</Label>
                        <p className="font-medium">{selectedRequest.cin_or_nf}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedRequest.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedRequest.phone_number}
                        </p>
                      </div>
                      {'region' in selectedRequest && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Region</Label>
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
                        <Label className="text-sm text-muted-foreground">Brand & Model</Label>
                        <p className="font-medium">{selectedRequest.car_brand} {selectedRequest.car_model}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Version</Label>
                        <p className="font-medium">{selectedRequest.car_version}</p>
                      </div>
                      {'car_price' in selectedRequest && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Price</Label>
                          <p className="font-medium text-lg">{selectedRequest.car_price}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          <Badge className={statusColors[selectedRequest.status]}>
                            {selectedRequest.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Request Date</Label>
                        <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedRequest.email}?subject=Devis Request - ${selectedRequest.car_brand} ${selectedRequest.car_model}`}>
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
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}