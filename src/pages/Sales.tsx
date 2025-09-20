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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye, Edit, Trash2, Plus } from "lucide-react";

// Sample sales data
const salesData = [
  {
    id: "S001",
    customer: "John Smith",
    email: "john@email.com",
    carModel: "BMW X5 2024",
    price: "$65,000",
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: "S002",
    customer: "Sarah Johnson",
    email: "sarah@email.com",
    carModel: "Mercedes C-Class",
    price: "$45,000",
    status: "pending",
    date: "2024-01-14",
  },
  {
    id: "S003",
    customer: "Mike Davis",
    email: "mike@email.com",
    carModel: "Audi A4",
    price: "$38,000",
    status: "in-progress",
    date: "2024-01-13",
  },
  {
    id: "S004",
    customer: "Emma Wilson",
    email: "emma@email.com",
    carModel: "Tesla Model 3",
    price: "$42,000",
    status: "completed",
    date: "2024-01-12",
  },
  {
    id: "S005",
    customer: "David Brown",
    email: "david@email.com",
    carModel: "Honda Civic",
    price: "$28,000",
    status: "pending",
    date: "2024-01-11",
  },
];

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  "in-progress": "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSales = salesData.filter((sale) => {
    const matchesSearch = sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.carModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sales</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your sales requests and track performance
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer or car model..."
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
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Table */}
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Car Model</TableHead>
                  <TableHead className="hidden lg:table-cell">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{sale.customer}</div>
                        <div className="text-sm text-muted-foreground">{sale.email}</div>
                        {/* Mobile-only info */}
                        <div className="md:hidden mt-2 space-y-1">
                          <div className="text-xs text-muted-foreground">{sale.carModel}</div>
                          <div className="text-xs font-medium text-foreground">{sale.price}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{sale.carModel}</TableCell>
                    <TableCell className="font-semibold text-foreground hidden lg:table-cell">{sale.price}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[sale.status as keyof typeof statusColors]}>
                        {sale.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {new Date(sale.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => alert(`Viewing sale: ${sale.customer} - ${sale.carModel}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => alert(`Editing sale: ${sale.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                          if (confirm('Delete this sale record?')) {
                            alert('Sale deleted!');
                            window.location.reload();
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {filteredSales.length} of {salesData.length} sales
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