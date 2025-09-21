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
import { supabase } from "@/lib/supabaseClient";

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

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground", 
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
const [rescheduleData, setRescheduleData] = useState<{ date: string; time: string }>({ date: '', time: '' });
const [appointmentToReschedule, setAppointmentToReschedule] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (appointment.car_brand && appointment.car_brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (appointment.car_model && appointment.car_model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointment_requests')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment status:', error);
        setError('Failed to update appointment status');
      } else {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
    
  };

    // Initial fetch
    useEffect(() => {
      fetchAppointments();
  
      // Optional: Real-time updates
      const channel = supabase
        .channel('appointment_requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointment_requests' },
          (payload) => {
            console.log('Change received!', payload);
            fetchAppointments(); // Refetch on any change
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointment_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching appointments:', error);
          setError('Failed to load appointments');
        } else {
          setAppointments(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    const rescheduleAppointment = (appointmentId: string) => {
      // Get current appointment to pre-fill if needed
      const current = appointments.find(a => a.id === appointmentId);
      setRescheduleData({
        date: current?.appointment_date || '',
        time: current?.appointment_time || '',
      });
      setAppointmentToReschedule(appointmentId);
      setIsRescheduleModalOpen(true);
    };

    const handleSaveReschedule = async () => {
      if (!appointmentToReschedule || !rescheduleData.date || !rescheduleData.time) {
        alert('Please select both date and time.');
        return;
      }
    
      try {
        setLoading(true);
        const { error } = await supabase
          .from('appointment_requests')
          .update({
            appointment_date: rescheduleData.date,
            appointment_time: rescheduleData.time,
          })
          .eq('id', appointmentToReschedule);
    
        if (error) {
          console.error('Error rescheduling appointment:', error);
          setError('Failed to reschedule appointment');
        } else {
          fetchAppointments(); // Refresh list
          setIsRescheduleModalOpen(false); // Close modal
          setRescheduleData({ date: '', time: '' });
          setAppointmentToReschedule(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
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
                          <DialogContent className="max-w-2xl  overflow-y-auto  ">
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
                                      <div><label className="text-sm text-muted-foreground">Message</label><p className="font-medium">{selectedAppointment.message || 'No message'}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Appointment Date</label><p className="font-medium">{selectedAppointment.appointment_date || 'Not provided'}</p></div>
                                      <div><label className="text-sm text-muted-foreground">Appointment Time</label><p className="font-medium">{selectedAppointment.appointment_time || 'Not provided'}</p></div>
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
                                    }}>Confirm Appointment</Button>
                                  )}
                                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                                    <Button variant="outline" onClick={() => rescheduleAppointment(selectedAppointment.id)}>Reschedule</Button>
                                  )}
                                  {selectedAppointment.status === 'confirmed' && (
                                    <Button onClick={() => {
                                      updateAppointmentStatus(selectedAppointment.id, 'completed');
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
      {/* Reschedule Appointment Modal */}
<Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Reschedule Appointment</DialogTitle>
      <DialogDescription>
        Choose a new date and time for this appointment.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="date" className="text-right text-sm font-medium">
          Date
        </label>
        <Input
          id="date"
          type="date"
          value={rescheduleData.date}
          onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="time" className="text-right text-sm font-medium">
          Time
        </label>
        <Input
          id="time"
          type="time"
          value={rescheduleData.time}
          onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
          className="col-span-3"
        />
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSaveReschedule} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </DashboardLayout>
  );
}