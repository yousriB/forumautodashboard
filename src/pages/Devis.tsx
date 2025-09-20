import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Eye, FileText, Car, User, DollarSign, Mail, Phone, MapPin , CheckCheck} from "lucide-react";

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
  status: 'pending' | 'processing' | 'completed' | 'rejected';
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
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  responded_by: string | null;
  responded_at: string | null;
}

const sampleDevisRequests: DevisRequest[] = [
  {
    id: "DV001",
    car_brand: "BMW",
    car_model: "X5",
    car_version: "xDrive40i",
    car_price: "$65,000",
    first_name: "Ahmed",
    last_name: "Ben Ali",
    email: "ahmed.benali@email.com",
    phone_number: "+216 20 123 456",
    cin_or_nf: "12345678",
    created_at: "2024-01-15T10:30:00Z",
    status: "pending",
    responded_by: null,
    responded_at: null
  },
  {
    id: "DV002",
    car_brand: "Mercedes-Benz",
    car_model: "C-Class",
    car_version: "C300",
    car_price: "$45,000",
    first_name: "Fatma",
    last_name: "Trabelsi",
    email: "fatma.trabelsi@email.com",
    phone_number: "+216 25 987 654",
    cin_or_nf: "87654321",
    created_at: "2024-01-14T14:20:00Z",
    status: "processing",
    responded_by: "user-123",
    responded_at: "2024-01-14T15:00:00Z"
  }
];

const sampleCustomDevisRequests: CustomDevisRequest[] = [
  {
    id: "CDV001",
    first_name: "Mohamed",
    last_name: "Hamdi",
    phone_number: "+216 22 555 777",
    cin_or_nf: "11223344",
    email: "mohamed.hamdi@email.com",
    car_brand: "Audi",
    car_model: "A4",
    car_version: "Premium Plus",
    region: "Tunis",
    created_at: "2024-01-13T09:15:00Z",
    status: "completed",
    responded_by: "user-456",
    responded_at: "2024-01-13T16:30:00Z"
  },
  {
    id: "CDV002",
    first_name: "Leila",
    last_name: "Bouaziz",
    phone_number: "+216 24 333 888",
    cin_or_nf: "55667788",
    email: "leila.bouaziz@email.com",
    car_brand: "Tesla",
    car_model: "Model 3",
    car_version: "Long Range",
    region: "Sfax",
    created_at: "2024-01-12T11:45:00Z",
    status: "pending",
    responded_by: null,
    responded_at: null
  }
];

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  processing: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
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

  const filterRequests = (requests: any[]) => {
    return requests.filter((request) => {
      const matchesSearch = request.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.car_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.car_model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const viewRequest = (request: DevisRequest | CustomDevisRequest, type: 'standard' | 'custom') => {
    setSelectedRequest(request);
    setRequestType(type);
    setIsViewDialogOpen(true);
  };

  const openResponseDialog = (request: DevisRequest | CustomDevisRequest, type: 'standard' | 'custom') => {
    setSelectedRequest(request);
    setRequestType(type);
    setResponseText("");
    setResponsePrice("");
    setIsResponseDialogOpen(true);
  };

  const updateDevisStatus = (requestId: string, newStatus: string, type: 'standard' | 'custom') => {
    const requests = type === 'standard' ? sampleDevisRequests : sampleCustomDevisRequests;
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      requests[requestIndex].status = newStatus as any;
      requests[requestIndex].responded_by = "current-user";
      requests[requestIndex].responded_at = new Date().toISOString();
      setIsResponseDialogOpen(false);
      // In real app, this would refresh the data
    }
  };

  const sendResponse = () => {
    if (selectedRequest && responseText.trim()) {
      updateDevisStatus(selectedRequest.id, 'completed', requestType);
      setResponseText("");
      setResponsePrice("");
    }
  };

  const filteredDevis = filterRequests(sampleDevisRequests);
  const filteredCustomDevis = filterRequests(sampleCustomDevisRequests);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
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
                <p className="text-lg sm:text-2xl font-bold text-foreground">{sampleDevisRequests.length + sampleCustomDevisRequests.length}</p>
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
                  {[...sampleDevisRequests, ...sampleCustomDevisRequests].filter(r => r.status === 'pending').length}
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
                  {[...sampleDevisRequests, ...sampleCustomDevisRequests].filter(r => r.status === 'processing').length}
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
                  {[...sampleDevisRequests, ...sampleCustomDevisRequests].filter(r => r.status === 'completed').length}
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
                  {selectedRequest.status === 'pending' && (
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      openResponseDialog(selectedRequest, requestType);
                    }}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      processing
                      
                    </Button>
                  )}
                  {selectedRequest.status === 'processing' && (
                    <Button onClick={() => updateDevisStatus(selectedRequest.id, 'completed', 'custom')}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Completed
                    </Button>
                  )}
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