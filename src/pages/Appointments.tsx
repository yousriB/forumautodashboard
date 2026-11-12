import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Calendar as DayCalendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Eye,
  Calendar as CalendarIcon,
  Clock,
  Car,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { queryKeys } from "@/lib/queryKeys";
import { applyChange, uniqueChannelName } from "@/lib/realtimeHelpers";

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
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

type AppointmentStatus = AppointmentRequest["status"];

const statusColors = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

async function fetchAppointments(
  signal?: AbortSignal
): Promise<AppointmentRequest[]> {
  let query = supabase
    .from("appointment_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AppointmentRequest[]) ?? [];
}

export default function Appointments() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentRequest | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    date: string;
    time: string;
  }>({ date: "", time: "" });
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<
    string | null
  >(null);
  const [isAppointmentDetailsDialogOpen, setIsAppointmentDetailsDialogOpen] =
    useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────
  const {
    data: appointments = [],
    isLoading: queryLoading,
  } = useQuery<AppointmentRequest[]>({
    queryKey: queryKeys.appointments.all,
    queryFn: ({ signal }) => fetchAppointments(signal),
  });

  // ── Realtime: patch the cache on each event instead of refetching ───────
  useEffect(() => {
    const channelName = uniqueChannelName("appointments-list");
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_requests" },
        (payload) => {
          queryClient.setQueryData<AppointmentRequest[]>(
            queryKeys.appointments.all,
            (old) => applyChange(old, payload as never)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const statusMutation = useMutation<
    void,
    Error,
    { appointmentId: string; newStatus: AppointmentStatus },
    { previous: AppointmentRequest[] | undefined }
  >({
    mutationFn: async ({ appointmentId, newStatus }) => {
      const { error } = await supabase
        .from("appointment_requests")
        .update({ status: newStatus })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onMutate: async ({ appointmentId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });
      const previous = queryClient.getQueryData<AppointmentRequest[]>(
        queryKeys.appointments.all
      );
      queryClient.setQueryData<AppointmentRequest[]>(
        queryKeys.appointments.all,
        (old) =>
          (old ?? []).map((a) =>
            a.id === appointmentId ? { ...a, status: newStatus } : a
          )
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(queryKeys.appointments.all, ctx.previous);
      setError("Failed to update appointment status");
    },
    onSuccess: () => {
      setIsAppointmentDetailsDialogOpen(false);
    },
  });

  const rescheduleMutation = useMutation<
    void,
    Error,
    { appointmentId: string; date: string; time: string },
    { previous: AppointmentRequest[] | undefined }
  >({
    mutationFn: async ({ appointmentId, date, time }) => {
      const { error } = await supabase
        .from("appointment_requests")
        .update({
          appointment_date: date,
          appointment_time: time,
          status: "confirmed",
        })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onMutate: async ({ appointmentId, date, time }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });
      const previous = queryClient.getQueryData<AppointmentRequest[]>(
        queryKeys.appointments.all
      );
      queryClient.setQueryData<AppointmentRequest[]>(
        queryKeys.appointments.all,
        (old) =>
          (old ?? []).map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  appointment_date: date,
                  appointment_time: time,
                  status: "confirmed",
                }
              : a
          )
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(queryKeys.appointments.all, ctx.previous);
      setError("Failed to reschedule appointment");
    },
    onSuccess: () => {
      setIsRescheduleModalOpen(false);
      setIsAppointmentDetailsDialogOpen(false);
      setRescheduleData({ date: "", time: "" });
      setAppointmentToReschedule(null);
    },
  });

  const loading =
    queryLoading || statusMutation.isPending || rescheduleMutation.isPending;

  const updateAppointmentStatus = (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    if (statusMutation.isPending) return; // dedup double-click
    statusMutation.mutate({ appointmentId, newStatus });
  };

  const rescheduleAppointment = (appointmentId: string) => {
    const current = appointments.find((a) => a.id === appointmentId);
    setRescheduleData({
      date: current?.appointment_date || "",
      time: current?.appointment_time || "",
    });
    setAppointmentToReschedule(appointmentId);
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = () => {
    if (
      !appointmentToReschedule ||
      !rescheduleData.date ||
      !rescheduleData.time
    ) {
      alert("Please select both date and time.");
      return;
    }
    if (rescheduleMutation.isPending) return;
    rescheduleMutation.mutate({
      appointmentId: appointmentToReschedule,
      date: rescheduleData.date,
      time: rescheduleData.time,
    });
  };

  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const hasAppointmentOn = (d: Date) =>
    appointments.some((e) => e.appointment_date === ymd(d));

  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [] as AppointmentRequest[];
    const key = ymd(selectedDate);
    return appointments.filter((e) => e.appointment_date === key);
  }, [appointments, selectedDate]);

  const handleDayClick = (date?: Date) => {
    if (!date) return;
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const formattedSelectedDate = selectedDate
    ? `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Appointment Requests
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage customer appointments and schedule new visits
            </p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full">
            <StatsCard
              title="Pending"
              value={appointments.filter((a) => a.status === "pending").length.toString()}
              icon={Clock}
            />
            <StatsCard
              title="Confirmed"
              value={appointments.filter((a) => a.status === "confirmed").length.toString()}
              icon={CheckCircle}
            />
            <StatsCard
              title="Completed"
              value={appointments.filter((a) => a.status === "completed").length.toString()}
              icon={CheckCircle}
            />
            <StatsCard
              title="Cancelled"
              value={appointments.filter((a) => a.status === "cancelled").length.toString()}
              icon={XCircle}
            />
          </div>
        </header>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Calendar - Full Width */}
        <Card className="p-2 sm:p-4 shadow-card border-border w-full">
          <DayCalendar
            mode="single"
            selected={selectedDate}
            onDayClick={handleDayClick}
            showOutsideDays
            className="w-full p-0 sm:p-3 pointer-events-auto"
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 flex-1",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-lg font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex w-full justify-around",
              head_cell:
                "text-muted-foreground rounded-md w-full sm:w-24 font-medium text-sm p-2",
              row: "flex w-full mt-2 sm:mt-3 justify-around gap-1 sm:gap-3",
              cell: "relative p-0 flex-1 h-16 sm:h-28 rounded-xl border border-border bg-primary/5 [&:has([aria-selected])]:ring-1 [&:has([aria-selected])]:ring-primary flex items-center justify-center text-center",
              day: "h-full w-full rounded-xl font-normal p-2 text-right text-base sm:text-lg",
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-40",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiers={{ hasEvent: hasAppointmentOn }}
            modifiersClassNames={{
              hasEvent:
                "relative after:content-[''] after:absolute after:bottom-1 after:left-1 after:w-3 after:h-3 after:rounded-full after:bg-red-500",
            }}
          />
        </Card>

        {/* Side sheet with appointments for selected day */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="left" className="w-full sm:w-[420px] max-w-full">
            <SheetHeader>
              <SheetTitle className="text-xl md:text-2xl">
                Appointments on{" "}
                {formattedSelectedDate && (
                  <span className="text-muted-foreground block text-lg sm:inline">
                    ({formattedSelectedDate})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="text-sm md:text-base">
                List of appointments for this date.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
              {appointmentsForSelectedDate.length > 0 ? (
                appointmentsForSelectedDate.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="p-4 border border-border"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {appointment.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {appointment.appointment_date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.appointment_time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {appointment.car_brand} {appointment.car_model}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 min-w-max">
                        <Badge
                          className={`${
                            statusColors[appointment.status]
                          } text-sm`}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                    {appointment.message && (
                      <p className="mt-3 text-sm text-foreground/80 bg-accent/50 p-3 rounded-md">
                        {appointment.message}
                      </p>
                    )}
                    <div className="mt-3 text-left sm:text-right">
                      <Dialog
                        open={
                          isAppointmentDetailsDialogOpen &&
                          selectedAppointment?.id === appointment.id
                        }
                        onOpenChange={setIsAppointmentDetailsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsAppointmentDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs sm:max-w-md md:max-w-2xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl">
                              Appointment Details
                            </DialogTitle>
                            <DialogDescription className="text-sm md:text-base">
                              View and manage appointment request
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAppointment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-lg">
                                    Customer Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">
                                        Name
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Email
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.email}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Phone
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.phone ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Appointment Date
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.appointment_date ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Appointment Time
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.appointment_time ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-medium text-lg">
                                    Vehicle Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">
                                        Vehicle
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.car_brand}{" "}
                                        {selectedAppointment.car_model}{" "}
                                        {selectedAppointment.car_year}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Chassis
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.car_chassis ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Services
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.service_types?.join(
                                          ", "
                                        ) || "None"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {selectedAppointment.message && (
                                <div>
                                  <label className="text-sm text-muted-foreground">
                                    Message
                                  </label>
                                  <p className="p-3 bg-secondary rounded-lg text-sm">
                                    {selectedAppointment.message}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 justify-end">
                                {selectedAppointment.status === "pending" && (
                                  <Button
                                    className="w-full sm:w-auto"
                                    disabled={statusMutation.isPending}
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        selectedAppointment.id,
                                        "confirmed"
                                      )
                                    }
                                  >
                                    Confirm Appointment
                                  </Button>
                                )}
                                {(selectedAppointment.status === "pending" ||
                                  selectedAppointment.status ===
                                    "confirmed") && (
                                  <Button
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    disabled={statusMutation.isPending}
                                    onClick={() =>
                                      rescheduleAppointment(
                                        selectedAppointment.id
                                      )
                                    }
                                  >
                                    Reschedule
                                  </Button>
                                )}
                                {selectedAppointment.status === "confirmed" && (
                                  <Button
                                    className="w-full sm:w-auto"
                                    disabled={statusMutation.isPending}
                                    onClick={() =>
                                      updateAppointmentStatus(
                                        selectedAppointment.id,
                                        "completed"
                                      )
                                    }
                                  >
                                    Mark as Completed
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  asChild
                                  className="w-full sm:w-auto"
                                >
                                  <a
                                    href={`mailto:${selectedAppointment.email}?subject=Appointment Confirmation&body=Dear ${selectedAppointment.name},%0A%0AYour appointment has been confirmed.%0A%0ABest regards,%0AAutoDealer Team`}
                                  >
                                    Send Email
                                  </a>
                                </Button>
                                {(selectedAppointment.status === "pending" ||
                                  selectedAppointment.status ===
                                    "confirmed") && (
                                  <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                    disabled={statusMutation.isPending}
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Are you sure you want to cancel this appointment?"
                                        )
                                      ) {
                                        updateAppointmentStatus(
                                          selectedAppointment.id,
                                          "cancelled"
                                        );
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground border border-dashed">
                  No appointments on this day
                </Card>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Reschedule Appointment Modal */}
      <Dialog
        open={isRescheduleModalOpen}
        onOpenChange={setIsRescheduleModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base">
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
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsRescheduleModalOpen(false)}
              disabled={rescheduleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSaveReschedule}
              disabled={loading}
            >
              {rescheduleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
