"use client";

import { useState, useEffect, useMemo } from "react"; // Added useMemo
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
  Legend // Added Legend for pie chart
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming you have a Select component

type DashboardData = {
  total_contacts: number;
  total_appointments: number;
  total_test_drives: number;
  total_sales: number;
  pending_sales: number;
  completed_sales_per_brand: { car_brand: string; total_sales: number }[];
  pending_sales_per_brand: { car_brand: string; total_sales: number }[];
};

// Type for the data returned by get_requests_pie_chart_data
type PieChartRequestData = {
  status_category: string;
  request_count: number;
  total_requests: number;
}[];

const PIE_COLORS = ['#22c55e', '#f97316', '#0088FE', '#ef4444', '#eab308', '#000000']; // Colors for the pie chart segments

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  // State for Pie Chart Filters
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // State for Pie Chart Data
  const [pieChartData, setPieChartData] = useState<PieChartRequestData | null>(null);
  const [pieChartTotalRequests, setPieChartTotalRequests] = useState<number>(0);
  const [pieChartLoading, setPieChartLoading] = useState(false);

  const brands = [
    "ISUZU", "CHEVROLET", "CHERY", "GREAT WALL", "HAVAL", "GAC",
    "TOYOTA", "SUZUKI", "MG", "FORD", "DFSK", "DONGFENG",
    "BYD", "RENAULT", "DACIA", "NISSAN"
  ];

  const quickActions = [
    { name: "Manage Appointments", href: "/appointments", icon: Calendar },
    { name: "Manage Devis", href: "/devis", icon: FileText },
    { name: "Manage Messages", href: "/messages", icon: MessageCircle },
    { name: "Manage Users", href: "/users", icon: Users },
  ];

  // Helper arrays for months and years
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(0, i).toLocaleString('en-US', { month: 'long' })
  })), []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ // Current year + 4 future years
      value: (currentYear + i).toString(),
      label: (currentYear + i).toString()
    }));
  }, []);

  // Fetch initial dashboard data and appointments
  useEffect(() => {
    const fetchDashboardAndAppointments = async () => {
      setLoading(true);
      const { data: dashboardData, error: dashboardError } = await supabase.rpc("get_admin_dashboard_data");
      if (dashboardError) {
        console.error("Error fetching dashboard data:", dashboardError.message);
      } else {
        setData(dashboardData as DashboardData);
        // Optionally extract brands from dashboardData if available, or fetch them
        const completedBrands = Array.isArray(dashboardData.completed_sales_per_brand) 
          ? dashboardData.completed_sales_per_brand.map((item: { car_brand: string }) => item.car_brand) 
          : [];
        const pendingBrands = Array.isArray(dashboardData.pending_sales_per_brand) 
          ? dashboardData.pending_sales_per_brand.map((item: { car_brand: string }) => item.car_brand) 
          : [];
        
        const brandsFromDashboard = [...completedBrands, ...pendingBrands];
        const uniqueBrands = Array.from(new Set(brandsFromDashboard.filter((brand): brand is string => typeof brand === 'string')));
        
        setAvailableBrands(uniqueBrands);
        if (uniqueBrands.length > 0 && !selectedBrand) {
          setSelectedBrand(uniqueBrands[0]); // Set first available brand as default
        }
      }

      const { data: appointmentData, error: appointmentError } = await supabase.from("appointment_requests").select("*");
      if (appointmentError) {
        console.error("Error fetching appointments:", appointmentError.message);
      } else {
        setAppointments(appointmentData);
      }
      setLoading(false);
    };

    fetchDashboardAndAppointments();
  }, []); // Run once on component mount

  // Fetch pie chart data whenever filters (brand, month, year) change
  useEffect(() => {
    const fetchPieChartData = async () => {
      if (!selectedBrand || !selectedMonth || !selectedYear) {
        setPieChartData(null);
        setPieChartTotalRequests(0);
        return;
      }

      setPieChartLoading(true);
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_requests_pie_chart_data", {
        p_brand: selectedBrand === 'all' ? null : selectedBrand,
        p_month: selectedMonth === 'all' ? null : parseInt(selectedMonth),
        p_year: selectedYear === 'all' ? null : parseInt(selectedYear)
      });

      if (rpcError) {
        console.error("Error fetching pie chart data:", rpcError.message);
        setPieChartData(null);
        setPieChartTotalRequests(0);
      } else {
        setPieChartData(rpcData as PieChartRequestData);
        // Calculate total requests for display outside the pie chart
        const total = rpcData && rpcData.length > 0 ? rpcData[0].total_requests : 0;
        setPieChartTotalRequests(total);
      }
      setPieChartLoading(false);
    };

    fetchPieChartData();
  }, [selectedBrand, selectedMonth, selectedYear]); // Re-run when filters change

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

  // Calculate percentages for pie chart if data exists
  const processedPieChartData = pieChartData ? pieChartData.map((item, index) => ({
    ...item,
    // Calculate percentage if total_requests is not zero to avoid division by zero
    percentage: item.total_requests > 0 ? (item.request_count / item.total_requests) * 100 : 0,
    fill: PIE_COLORS[index % PIE_COLORS.length] // Assign a color
  })) : [];


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

        {/* Request Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Overview</CardTitle>
            <CardDescription>
              Status breakdown of requests by brand, month, and year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <div>
                <label htmlFor="brand-select" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <Select
                  value={selectedBrand}
                  onValueChange={setSelectedBrand}
                  name="brand-select"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  name="month-select"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  name="year-select"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pieChartTotalRequests > 0 && (
                <div className="ml-auto text-lg font-semibold">
                  Total Requests: {pieChartTotalRequests}
                </div>
              )}
            </div>

            {pieChartLoading ? (
              <div className="flex justify-center items-center h-[300px]">Loading chart data...</div>
            ) : processedPieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedPieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status_category, percentage }: { status_category: string; percentage: number }) => `${status_category} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="request_count"
                  >
                    {processedPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value} requests`, props.payload.status_category]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                No request data available for the selected filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}