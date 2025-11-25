"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Car,
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

// Color Palette mapping for statuses
const STATUS_COLORS = {
  created: "#eab308",    // Yellow for Pending/Created
  processing: "#3b82f6", // Blue for Processing
  completed: "#22c55e",  // Green for Completed
  sold: "#15803d",       // Dark Green for Sold
  rejected: "#ef4444",   // Red for Rejected
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Default to current date
  const currentDate = new Date();
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Data State
  const [stats, setStats] = useState({
    created_count: 0,
    processing_count: 0,
    completed_count: 0,
    sold_count: 0,
    rejected_count: 0,
  });

  const brands = [
    "ISUZU", "CHEVROLET", "CHERY", "GREAT WALL", "HAVAL", "GAC", "TOYOTA",
    "SUZUKI", "MG", "FORD", "DFSK", "DONGFENG", "BYD", "RENAULT", "DACIA", "NISSAN",
  ];

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
      value: (currentYear - 2 + i).toString(), // Show last 2 years + next 2 years
      label: (currentYear - 2 + i).toString(),
    }));
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase.rpc("get_monthly_car_stats", {
          target_year: parseInt(selectedYear),
          target_month: parseInt(selectedMonth),
          target_brand: selectedBrand,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          setStats(data[0]);
        } else {
          // Reset if no data returned
          setStats({
            created_count: 0,
            processing_count: 0,
            completed_count: 0,
            sold_count: 0,
            rejected_count: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching car stats:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedBrand, selectedMonth, selectedYear]);

  // Prepare Chart Data
  const chartData = [
    { name: "Pending", value: stats.created_count, color: STATUS_COLORS.created },
    { name: "Processing", value: stats.processing_count, color: STATUS_COLORS.processing },
    { name: "Completed", value: stats.completed_count, color: STATUS_COLORS.completed },
    { name: "Sold", value: stats.sold_count, color: STATUS_COLORS.sold },
    { name: "Rejected", value: stats.rejected_count, color: STATUS_COLORS.rejected },
  ].filter(item => item.value > 0); // Hide empty slices

  const totalRequests = 
    stats.created_count + 
    stats.processing_count + 
    stats.completed_count + 
    stats.sold_count + 
    stats.rejected_count;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Performance overview for <span className="font-medium text-foreground">{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
            </p>
          </div>
          
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 bg-white p-2 rounded-lg border shadow-sm w-full sm:w-auto">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 font-medium">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px] border-none shadow-none focus:ring-0 font-medium">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] border-none shadow-none focus:ring-0 font-medium">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Pending"
            value={stats.created_count}
            icon={Calendar}
            description="Created this month"
            className="border-l-4 border-l-yellow-500"
          />
          <StatsCard
            title="Processing"
            value={stats.processing_count}
            icon={Loader2}
            description="Active processing"
            className="border-l-4 border-l-blue-500"
          />
          <StatsCard
            title="Completed"
            value={stats.completed_count}
            icon={CheckCircle2}
            description="Finished requests"
            className="border-l-4 border-l-green-500"
          />
          <StatsCard
            title="Sold"
            value={stats.sold_count}
            icon={DollarSign}
            description="Closed sales"
            className="border-l-4 border-l-green-700"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected_count}
            icon={XCircle}
            description="Dropped requests"
            className="border-l-4 border-l-red-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Activity Distribution</CardTitle>
              <CardDescription>
                Breakdown of {totalRequests} total events recorded in {months.find(m => m.value === selectedMonth)?.label}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#374151', fontWeight: 600 }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-[300px] text-muted-foreground bg-gray-50 rounded-lg">
                  <Car className="h-12 w-12 mb-2 opacity-20" />
                  <p>No activity found for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Summary / Side Panel (Optional) */}
          <Card className="shadow-sm bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-white">Monthly Insights</CardTitle>
              <CardDescription className="text-slate-400">
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">Conversion Rate (Sold/Created)</div>
                <div className="text-3xl font-bold">
                  {stats.created_count > 0 
                    ? ((stats.sold_count / stats.created_count) * 100).toFixed(1) 
                    : "0.0"}%
                </div>
              </div>
              
              <div className="h-px bg-slate-800" />
              
              <div>
                <div className="text-sm font-medium text-slate-400 mb-1">Rejection Rate</div>
                <div className="text-3xl font-bold">
                  {totalRequests > 0 
                    ? ((stats.rejected_count / totalRequests) * 100).toFixed(1) 
                    : "0.0"}%
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-xs text-slate-400 leading-relaxed">
                  These stats reflect specific actions taken in 
                  <span className="text-white font-semibold"> {months.find(m => m.value === selectedMonth)?.label}</span>. 
                  A car is counted here only if its status changed during this month.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}