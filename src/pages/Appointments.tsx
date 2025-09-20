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
import { Search, Filter, Eye, Edit, Calendar, Plus, Car, Phone, Mail } from "lucide-react";

// Based on appointment_requests schema
interface AppointmentRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: string | null;
  car_chassis: string | null;
  service_types: string[] | null;
  message: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  created_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const sampleAppointments: AppointmentRequest[] = [
  {
    id: "A001",
    name: "Jennifer Lopez",
    email: "jennifer@email.com",
    phone: "+1 (555) 123-4567",
    car_brand: "BMW",
    car_model: "X3",
    car_year: "2024",
    car_chassis: "WBAXH9C50KDP12345",
    service_types: ["Test Drive", "Inspection"],
    message: "I would like to schedule a test drive for the BMW X3",
    appointment_date: "2024-01-20",
    appointment_time: "10:00",
    status: "pending",
    created_at: "2024-01-15T09:00:00Z"
  },
  {
    id: "A002",
    name: "Robert Taylor", 
    email: "robert@email.com",
    phone: "+1 (555) 987-6543",
    car_brand: "Mercedes-Benz",
    car_model: "GLE",
    car_year: "2023",
    car_chassis: "4JGDA5HB8KA123456",
    service_types: ["Service", "Maintenance"],
    message: "Need regular service for my Mercedes GLE",
    appointment_date: "2024-01-20",
    appointment_time: "14:30",
    status: "confirmed",
    created_at: "2024-01-14T11:00:00Z"
  },
  {
    id: "A003",
    name: "Lisa Anderson",
    email: "lisa@email.com",
    phone: "+1 (555) 456-7890",
    car_brand: "Audi",
    car_model: "Q5",
    car_year: "2024",
    car_chassis: "WA1BNAFY6K2123456",
    service_types: ["Test Drive"],
    message: "Interested in test driving the new Audi Q5",
    appointment_date: "2024-01-21", 
    appointment_time: "11:15",
    status: "completed",
    created_at: "2024-01-13T16:45:00Z"
  },
  {
    id: "A004",
    name: "Mark Johnson",
    email: "mark@email.com",
    phone: "+1 (555) 234-5678",
    car_brand: "Tesla",
    car_model: "Model Y",
    car_year: "2024",
    car_chassis: "5YJYGDEE5KF123456",
    service_types: ["Consultation"],
    message: "Want to discuss Tesla Model Y options and pricing",
    appointment_date: "2024-01-21",
    appointment_time: "15:00",
    status: "cancelled",
    created_at: "2024-01-12T13:20:00Z"
  }
];

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground", 
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null);

  const filteredAppointments = sampleAppointments.filter((appointment) => {
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (appointment.car_brand && appointment.car_brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (appointment.car_model && appointment.car_model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateAppointmentStatus = (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    const appointmentIndex = sampleAppointments.findIndex(a => a.id === appointmentId);
    if (appointmentIndex !== -1) {
      sampleAppointments[appointmentIndex].status = newStatus;
      setSelectedAppointment(null);
      window.location.reload(); // Temporary solution for demo
    }
  };

  const rescheduleAppointment = (appointmentId: string) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    
    if (newDate && newTime) {
      const appointmentIndex = sampleAppointments.findIndex(a => a.id === appointmentId);
      if (appointmentIndex !== -1) {
        sampleAppointments[appointmentIndex].appointment_date = newDate;
        sampleAppointments[appointmentIndex].appointment_time = newTime;
        alert('Appointment rescheduled successfully!');
        setSelectedAppointment(null);
        window.location.reload();
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Appointment Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Manage customer appointments and schedule new visits</p>
          </div>
         
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by customer or car details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 input-field" />
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

        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                  <TableHead className="hidden lg:table-cell">Services</TableHead>
                  <TableHead className="hidden sm:table-cell">Appointment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{appointment.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{appointment.email}</span>
                        </div>
                        {appointment.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />{appointment.phone}
                          </div>
                        )}
                        {/* Mobile-only info */}
                        <div className="md:hidden mt-2 space-y-1">
                          {appointment.car_brand && appointment.car_model && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {appointment.car_brand} {appointment.car_model}
                            </div>
                          )}
                          {appointment.service_types && (
                            <div className="flex flex-wrap gap-1">
                              {appointment.service_types.slice(0, 2).map((service, index) => (
                                <Badge key={index} variant="outline" className="text-xs">{service}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {appointment.car_brand && appointment.car_model ? (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{appointment.car_brand} {appointment.car_model}</div>
                            <div className="text-sm text-muted-foreground">{appointment.car_year}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No vehicle specified</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {appointment.service_types?.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{service}</Badge>
                        )) || <span className="text-muted-foreground">No services</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {appointment.appointment_date && appointment.appointment_time ? (
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">{appointment.appointment_time}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAppointment(appointment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Appointment Details</DialogTitle>
                              <DialogDescription>View and manage appointment request</DialogDescription>
                            </DialogHeader>
                            {selectedAppointment && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Customer Information</h4>
                                    <div className="space-y-2">
                                      <div><label className="text-sm text-muted-foreground">Name</label><p className="font-medium">{selectedAppointment.name}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Email</label><p className="font-medium">{selectedAppointment.email}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Phone</label><p className="font-medium">{selectedAppointment.phone || 'Not provided'}</p></div>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Vehicle Information</h4>
                                    <div className="space-y-2">
                                      <div><label className="text-sm text-muted-foreground">Vehicle</label><p className="font-medium">{selectedAppointment.car_brand} {selectedAppointment.car_model} {selectedAppointment.car_year}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Chassis</label><p className="font-medium">{selectedAppointment.car_chassis || 'Not provided'}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Services</label><p className="font-medium">{selectedAppointment.service_types?.join(', ') || 'None'}</p></div>
                                    </div>
                                  </div>
                                </div>
                                {selectedAppointment.message && (
                                  <div><label className="text-sm text-muted-foreground">Message</label><p className="p-3 bg-secondary rounded-lg">{selectedAppointment.message}</p></div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {selectedAppointment.status === 'pending' && (
                                    <Button onClick={() => {
                                      updateAppointmentStatus(selectedAppointment.id, 'confirmed');
                                      alert('Appointment confirmed!');
                                    }}>Confirm Appointment</Button>
                                  )}
                                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                                    <Button variant="outline" onClick={() => rescheduleAppointment(selectedAppointment.id)}>Reschedule</Button>
                                  )}
                                  {selectedAppointment.status === 'confirmed' && (
                                    <Button onClick={() => {
                                      updateAppointmentStatus(selectedAppointment.id, 'completed');
                                      alert('Appointment marked as completed!');
                                    }}>Mark as Completed</Button>
                                  )}
                                  <Button variant="outline" asChild>
                                    <a href={`mailto:${selectedAppointment.email}?subject=Appointment Confirmation&body=Dear ${selectedAppointment.name},%0A%0AYour appointment has been confirmed.%0A%0ABest regards,%0AAutoDealer Team`}>
                                      Send Email
                                    </a>
                                  </Button>
                                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                                    <Button variant="destructive" onClick={() => {
                                      if (confirm('Are you sure you want to cancel this appointment?')) {
                                        updateAppointmentStatus(selectedAppointment.id, 'cancelled');
                                        alert('Appointment cancelled.');
                                      }
                                    }}>Cancel</Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}