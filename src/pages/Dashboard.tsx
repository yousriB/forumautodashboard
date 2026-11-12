"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { queryKeys } from "@/lib/queryKeys";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MonthlyCarStats = {
  created_count: number;
  processing_count: number;
  completed_count: number;
  sold_count: number;
  rejected_count: number;
};

const EMPTY_STATS: MonthlyCarStats = {
  created_count: 0,
  processing_count: 0,
  completed_count: 0,
  sold_count: 0,
  rejected_count: 0,
};

// Color Palette mapping for statuses
const STATUS_COLORS = {
  created: "#e9c46a",    // amber  — pending
  processing: "#a3a39c", // stone  — processing
  completed: "#b9e34a",  // lime   — completed
  sold: "#1b1b1a",       // ink    — sold
  rejected: "#ec8a6b",   // coral  — rejected
};

export default function Dashboard() {
  // Default to current date
  const currentDate = new Date();
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

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

  // React Query handles dedup + caching: switching filters back and forth
  // re-uses the cached result within the 30s staleTime window instead of
  // refetching. The previous version refetched on every dep change.
  const { data: stats = EMPTY_STATS, isLoading: loading } = useQuery<MonthlyCarStats>({
    queryKey: queryKeys.dashboard.monthlyCarStats(selectedYear, selectedMonth, selectedBrand),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_car_stats", {
        target_year: parseInt(selectedYear),
        target_month: parseInt(selectedMonth),
        target_brand: selectedBrand,
      });
      if (error) throw error;
      return (data && data.length > 0 ? data[0] : EMPTY_STATS) as MonthlyCarStats;
    },
    // Keep the previous result on screen while the new filter loads so the
    // chart doesn't flash an empty state.
    placeholderData: (prev) => prev,
  });

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

  const monthLabel = months.find((m) => m.value === selectedMonth)?.label;
  const pct = (n: number) => (totalRequests > 0 ? (n / totalRequests) * 100 : 0);
  const conversion = pct(stats.sold_count);
  const rejection = pct(stats.rejected_count);
  const breakdown = [
    { label: "Pending", value: stats.created_count, color: STATUS_COLORS.created },
    { label: "Processing", value: stats.processing_count, color: STATUS_COLORS.processing },
    { label: "Completed", value: stats.completed_count, color: STATUS_COLORS.completed },
    { label: "Sold", value: stats.sold_count, color: "#f4f4f0" }, // light on the dark hero
    { label: "Rejected", value: stats.rejected_count, color: STATUS_COLORS.rejected },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-2 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Overview · {selectedBrand === "All" ? "All brands" : selectedBrand}</p>
            <h1 className="mt-2 text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              {monthLabel} <span className="text-muted-foreground/60">{selectedYear}</span>
            </h1>
          </div>

          {/* Filters */}
          <div className="grid w-full grid-cols-[1.2fr_1.2fr_1fr] items-center gap-1 rounded-full bg-card p-1.5 shadow-card sm:flex sm:w-auto">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-9 w-full sm:w-[140px] rounded-full border-none bg-secondary font-medium shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-full border-none bg-transparent font-medium shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 w-full sm:w-[96px] rounded-full border-none bg-primary font-medium text-primary-foreground shadow-none focus:ring-0 focus:ring-offset-0">
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

        {/* Hero: conversion */}
        <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium">Conversion</h2>
              <p className="mt-1 max-w-sm text-sm text-white/60">
                Share of events that ended in a sale in {monthLabel}, out of {totalRequests} recorded.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/80">
              {rejection.toFixed(1)}% rejected
            </span>
          </div>

          <div className="mt-10 flex items-end gap-2">
            <span className="text-7xl font-light leading-none tracking-tighter tabular-nums sm:text-8xl">
              {loading ? "–" : conversion.toFixed(1)}
            </span>
            <span className="mb-2 text-lg text-white/70">%</span>
          </div>

          {/* Stacked status bar */}
          <div className="mt-8 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/10">
            {breakdown.map((b) =>
              b.value > 0 ? (
                <div
                  key={b.label}
                  title={`${b.label}: ${b.value}`}
                  style={{ width: `${pct(b.value)}%`, background: b.color }}
                />
              ) : null,
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-white/55">
            {breakdown.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
                {b.label} {b.value}
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatsCard title="Pending" value={stats.created_count} icon={Calendar} description="Created this month" tone="amber" />
          <StatsCard title="Processing" value={stats.processing_count} icon={Loader2} description="Active processing" tone="stone" />
          <StatsCard title="Completed" value={stats.completed_count} icon={CheckCircle2} description="Finished requests" tone="lime" />
          <StatsCard title="Sold" value={stats.sold_count} icon={DollarSign} description="Closed sales" tone="ink" />
          <StatsCard
            title="Rejected"
            value={stats.rejected_count}
            icon={XCircle}
            description="Dropped requests"
            tone="coral"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Chart + rates */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity distribution</CardTitle>
              <CardDescription>
                Breakdown of {totalRequests} total events recorded in {monthLabel}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "14px", border: "none", boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.18)" }}
                        itemStyle={{ color: "#1b1b1a", fontWeight: 500 }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <Car className="mb-2 h-10 w-10 opacity-25" />
                  <p className="text-sm">No activity found for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly rates</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Conversion", hint: "Sold / all", value: conversion, bar: "bg-lime" },
                { label: "Rejection", hint: "Rejected / all", value: rejection, bar: "bg-[#ec8a6b]" },
              ].map((r) => (
                <div key={r.label} className="rounded-2xl bg-secondary p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <span className="eyebrow">{r.hint}</span>
                  </div>
                  <div className="mt-2 text-3xl font-light tabular-nums">{r.value.toFixed(1)}%</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card">
                    <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${Math.min(r.value, 100)}%` }} />
                  </div>
                </div>
              ))}
              <p className="px-1 pt-1 text-xs leading-relaxed text-muted-foreground">
                These stats reflect actions taken in <span className="font-medium text-foreground">{monthLabel}</span>.
                A car is counted only if its status changed during this month.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
