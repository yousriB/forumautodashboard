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
import { STATUS_HEX, STATUS_LABELS } from "@/types/devis";
import { useBrands } from "@/lib/brands";
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

// Same palette as the status badges (types/devis.ts).
const STATUS_COLORS = {
  created: STATUS_HEX.pending,
  processing: STATUS_HEX.processing,
  completed: STATUS_HEX.completed,
  sold: STATUS_HEX.sold,
  rejected: STATUS_HEX.rejected,
};

export default function Dashboard() {
  // Default to current date
  const currentDate = new Date();
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Active brands plus retired ones (FORD) so history stays reachable.
  const { brands, labelOf } = useBrands();

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString("fr-FR", { month: "long" }).replace(/^./, (c) => c.toUpperCase()),
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
    { name: STATUS_LABELS.pending, value: stats.created_count, color: STATUS_COLORS.created },
    { name: STATUS_LABELS.processing, value: stats.processing_count, color: STATUS_COLORS.processing },
    { name: STATUS_LABELS.sold, value: stats.sold_count, color: STATUS_COLORS.sold },
    { name: STATUS_LABELS.completed, value: stats.completed_count, color: STATUS_COLORS.completed },
    { name: STATUS_LABELS.rejected, value: stats.rejected_count, color: STATUS_COLORS.rejected },
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
    { label: STATUS_LABELS.pending, value: stats.created_count, color: STATUS_COLORS.created },
    { label: STATUS_LABELS.processing, value: stats.processing_count, color: STATUS_COLORS.processing },
    { label: STATUS_LABELS.sold, value: stats.sold_count, color: STATUS_COLORS.sold },
    { label: STATUS_LABELS.completed, value: stats.completed_count, color: STATUS_COLORS.completed },
    { label: STATUS_LABELS.rejected, value: stats.rejected_count, color: STATUS_COLORS.rejected },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-2 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Vue d’ensemble · {selectedBrand === "All" ? "Toutes les marques" : labelOf(selectedBrand)}</p>
            <h1 className="mt-2 text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              {monthLabel} <span className="text-muted-foreground/60">{selectedYear}</span>
            </h1>
          </div>

          {/* Filters */}
          <div className="grid w-full grid-cols-[1.2fr_1.2fr_1fr] items-center gap-1 rounded-full bg-card p-1.5 shadow-card sm:flex sm:w-auto">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-9 w-full sm:w-[170px] rounded-full border-none bg-secondary font-medium shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Toutes les marques</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.code} value={brand.code}>
                    {brand.label}
                    {!brand.active && " (historique)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-full border-none bg-transparent font-medium shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 w-full sm:w-[96px] rounded-full border-none bg-primary font-medium text-primary-foreground shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Année" />
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
              <h2 className="text-xl font-medium">Taux de conversion</h2>
              <p className="mt-1 max-w-sm text-sm text-white/60">
                Part des demandes du mois de {monthLabel} dont le dernier statut atteint est « Vente confirmée », sur {totalRequests}.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/80">
              {rejection.toFixed(1)}% annulés
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
          <StatsCard title={STATUS_LABELS.pending} value={stats.created_count} icon={Calendar} description="Reçues ce mois-ci" tone="amber" />
          <StatsCard title={STATUS_LABELS.processing} value={stats.processing_count} icon={Loader2} description="Passées en traitement" tone="stone" />
          <StatsCard title={STATUS_LABELS.sold} value={stats.sold_count} icon={DollarSign} description="Ventes conclues" tone="brand" />
          <StatsCard title={STATUS_LABELS.completed} value={stats.completed_count} icon={CheckCircle2} description="Véhicules livrés" tone="green" />
          <StatsCard
            title={STATUS_LABELS.rejected}
            value={stats.rejected_count}
            icon={XCircle}
            description="Ventes annulées"
            tone="coral"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Chart + rates */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Répartition de l’activité</CardTitle>
              <CardDescription>
                Répartition des {totalRequests} demandes actives en {monthLabel}, selon le dernier statut atteint.
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
                  <p className="text-sm">Aucune activité sur cette période</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taux du mois</CardTitle>
              <CardDescription>Indicateurs clés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Conversion", hint: "Ventes confirmées / total", value: conversion, bar: "bg-brand" },
                { label: "Annulation", hint: "Annulés / total", value: rejection, bar: "bg-[#f2b8a8]" },
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
                Ces chiffres reflètent les actions de <span className="font-medium text-foreground">{monthLabel}</span> :
                une demande n’est comptée que si son statut a changé pendant ce mois.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
