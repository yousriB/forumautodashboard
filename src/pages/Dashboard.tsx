"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  DollarSign,
  Calendar,
  MessageCircle,
  Users,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

type DashboardData = {
  total_contacts: number;
  total_appointments: number;
  total_test_drives: number;
  total_sales: number;
  pending_sales: number;
  completed_sales_per_brand: { car_brand: string; total_sales: number }[];
  pending_sales_per_brand: { car_brand: string; total_sales: number }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments , setAppointments] = useState<any[]>([]);
  const quickActions = [
    { name: "Manage Appointments", href: "/appointments", icon: Calendar },
    { name: "Manage Devis", href: "/devis", icon: FileText },
    { name: "Manage Messages", href: "/messages", icon: MessageCircle },
    { name: "Manage Users", href: "/users", icon: Users },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_admin_dashboard_data");
      if (error) {
        console.error("Error fetching dashboard data:", error.message);
      } else {
        setData(data as DashboardData);
      }
      setLoading(false);
    };

    const fetchAppointments = async () => {
      const { data, error } = await supabase.from("appointment_requests").select("*");
      if (error) {
        console.error("Error fetching appointments:", error.message);
      } else {
        setAppointments(data);
        //console the appointment where status is completed 
        console.log(data.filter((appointment) => appointment.status === "completed").length);
      }
    };

    fetchDashboardData();
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-500">Failed to load dashboard data.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your dealership today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            title="Completed Sales"
            value={data.total_sales.toString()}
            icon={DollarSign}
          />
          <StatsCard
            title="Appointments"
            value={data.total_appointments.toString()}
            icon={Calendar}
          />
          <StatsCard
            title="Messages"
            value={data.total_contacts.toString()}
            icon={MessageCircle}
          />
          <StatsCard
            title="Test Drive"
            value={data.total_test_drives.toString()}
            icon={Calendar}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Completed Sales per Brand */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Completed Sales per Brand</CardTitle>
              <CardDescription>
                Sales distribution by car brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.completed_sales_per_brand}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="car_brand"
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="total_sales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pending Sales per Brand */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Pending Sales per Brand</CardTitle>
              <CardDescription>
                Pending sales distribution by car brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.pending_sales_per_brand}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="car_brand"
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value}`, "Pending Sales"]}
                  />
                  <Bar
                    dataKey="total_sales"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Appointment Status */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Appointments Overview</CardTitle>
              {/* <CardDescription>
                Completed vs Pending appointments
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending Appointments", value: appointments.filter((appointment) => appointment.status === "pending").length, color: "#f59e0b" },
                      { name: "Completed Appointments", value: appointments.filter((appointment) => appointment.status === "completed").length, color: "#10b981" },
                      { name: "Confirmed Appointments", value: appointments.filter((appointment) => appointment.status === "confirmed").length, color: "#2481F9" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#2481F9" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dashboard-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="h-auto">
              <div className="grid md:grid-cols-2 gap-4 h-auto">
                {quickActions.map((action)=>(
                   <NavLink
                      key={action.name}
                      to={action.href}
                      className="flex gap-2 justify-center items-center border border-gray-300 shadow-sm hover:bg-[#2481F9] hover:text-white rounded-md  h-20 duration-300 transition-all"
                  >
                    <span className="font-medium">{action.name}</span>
                    <action.icon className="h-5 w-5" />

                  </NavLink>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
