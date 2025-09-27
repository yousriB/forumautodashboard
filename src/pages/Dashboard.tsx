"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  DollarSign,
  Calendar,
  MessageCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for the data returned by get_requests_pie_chart_data
type PieChartRequestData = {
  status_category: string;
  request_count: number;
  total_requests: number;
}[];

// Type for the new RPC function
type StatusTotals = {
  processing: number;
  completed: number;
  pending: number;
  sold: number;
};

const PIE_COLORS = [
  "#22c55e",
  "#f97316",
  "#0088FE",
  "#ef4444",
  "#eab308",
  "#000000",
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // StatsCards data
  const [statusTotals, setStatusTotals] = useState<StatusTotals>({
    processing: 0,
    completed: 0,
    pending: 0,
    sold: 0,
  });

  // Pie Chart Filters
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Pie Chart Data
  const [pieChartData, setPieChartData] = useState<PieChartRequestData | null>(
    null
  );
  const [pieChartTotalRequests, setPieChartTotalRequests] = useState<number>(0);
  const [pieChartLoading, setPieChartLoading] = useState(false);

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

  // Helper arrays for months and years
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString("en-US", { month: "long" }),
      })),
    []
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: (currentYear + i).toString(),
      label: (currentYear + i).toString(),
    }));
  }, []);

  // Fetch StatsCards data
  useEffect(() => {
    const fetchStatusTotals = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_requests_status_totals");
      if (error) {
        console.error("Error fetching status totals:", error.message);
      } else if (data && data.length > 0) {
        setStatusTotals(data[0]);
      }
      setLoading(false);
    };

    fetchStatusTotals();
  }, []);

  // Fetch pie chart data whenever filters change
  useEffect(() => {
    const fetchPieChartData = async () => {
      setPieChartLoading(true);
      const { data, error } = await supabase.rpc(
        "get_requests_pie_chart_data",
        {
          p_brand: selectedBrand === "all" ? null : selectedBrand,
          p_month:
            selectedMonth === "all" ? null : parseInt(selectedMonth, 10),
          p_year: selectedYear === "all" ? null : parseInt(selectedYear, 10),
        }
      );

      if (error) {
        console.error("Error fetching pie chart data:", error.message);
        setPieChartData(null);
        setPieChartTotalRequests(0);
      } else {
        setPieChartData(data as PieChartRequestData);
        const total =
          data && data.length > 0 ? data[0].total_requests : 0;
        setPieChartTotalRequests(total);
      }
      setPieChartLoading(false);
    };

    fetchPieChartData();
  }, [selectedBrand, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  // Prepare pie chart data
  const processedPieChartData = pieChartData
    ? pieChartData.map((item, index) => ({
        ...item,
        percentage:
          item.total_requests > 0
            ? (item.request_count / item.total_requests) * 100
            : 0,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
    : [];

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
            value={statusTotals.completed.toString()}
            icon={DollarSign}
          />
          <StatsCard
            title="Pending Sales"
            value={statusTotals.pending.toString()}
            icon={Calendar}
          />
          <StatsCard
            title="Processing Sales"
            value={statusTotals.processing.toString()}
            icon={MessageCircle}
          />
          <StatsCard
            title="Sold Cars"
            value={statusTotals.sold.toString()}
            icon={DollarSign}
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
              {/* Brand Filter */}
              <div>
                <label
                  htmlFor="brand-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Brand
                </label>
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
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div>
                <label
                  htmlFor="month-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Month
                </label>
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
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div>
                <label
                  htmlFor="year-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year
                </label>
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
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
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
              <div className="flex justify-center items-center h-[300px]">
                Loading chart data...
              </div>
            ) : processedPieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedPieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({
                      status_category,
                      request_count,
                    }: {
                      status_category: string;
                      request_count: number;
                    }) =>
                      `${status_category} (${request_count})`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="request_count"
                  >
                    {processedPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} requests`,
                      props.payload.status_category,
                    ]}
                  />
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
