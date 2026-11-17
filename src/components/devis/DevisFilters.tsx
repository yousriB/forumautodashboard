import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { STATUS_LABELS, STATUS_ORDER } from "@/types/devis";
import type { BrandInfo } from "@/lib/brands";
import { DATE_PRESETS, UI } from "@/utils/constants";

interface DevisFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  brandFilter: string;
  onBrandChange: (value: string) => void;
  /** Brands offered in the brand filter (a sales user only gets their own). */
  brandOptions: BrandInfo[];
  /** Label of the "all" option, e.g. "Toutes mes marques" for sales. */
  allBrandsLabel?: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onDateRangeChange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  className?: string;
}

export const DevisFilters: React.FC<DevisFiltersProps> = React.memo(
  ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    brandFilter,
    onBrandChange,
    brandOptions,
    allBrandsLabel = "Toutes les marques",
    dateRange,
    onDateRangeChange,
    hasActiveFilters,
    onClearFilters,
    className,
  }) => {
    const handleDatePreset = React.useCallback(
      (preset: string) => {
        const today = new Date();

        switch (preset) {
          case DATE_PRESETS.TODAY:
            onDateRangeChange({ from: today, to: today });
            break;
          case DATE_PRESETS.YESTERDAY:
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            onDateRangeChange({ from: yesterday, to: yesterday });
            break;
          case DATE_PRESETS.LAST_7_DAYS:
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 6);
            onDateRangeChange({ from: last7Days, to: today });
            break;
          case DATE_PRESETS.LAST_30_DAYS:
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 29);
            onDateRangeChange({ from: last30Days, to: today });
            break;
          case DATE_PRESETS.CLEAR:
            onDateRangeChange({ from: undefined, to: undefined });
            break;
        }
      },
      [onDateRangeChange]
    );

    return (
      <div className={`flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between ${className || ""}`}>
        {/* Search Bar - Left Side */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou véhicule…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 input-field h-10 rounded-full"
            maxLength={UI.MAX_SEARCH_LENGTH}
          />
        </div>

        {/* Filters - Right Side */}
        <div className="flex flex-wrap gap-1 bg-card p-1.5 rounded-full shadow-card w-full lg:w-auto">
          <Select value={brandFilter} onValueChange={onBrandChange}>
            <SelectTrigger className="w-[170px] border-none shadow-none focus:ring-0 font-medium" aria-label="Filtrer par marque">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{allBrandsLabel}</SelectItem>
              {brandOptions.map((brand) => (
                <SelectItem key={brand.code} value={brand.code}>
                  {brand.label}
                  {!brand.active && " (historique)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-[200px] justify-start text-left font-normal border-none shadow-none hover:bg-transparent"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "d MMM", { locale: fr })} -{" "}
                      {format(dateRange.to, "d MMM y", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "d MMM y", { locale: fr })
                  )
                ) : (
                  <span>Période</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
              <div className="flex flex-wrap gap-2 p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDatePreset(DATE_PRESETS.TODAY)}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDatePreset(DATE_PRESETS.YESTERDAY)}
                >
                  Hier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDatePreset(DATE_PRESETS.LAST_7_DAYS)}
                >
                  7 derniers jours
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDatePreset(DATE_PRESETS.LAST_30_DAYS)}
                >
                  30 derniers jours
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDatePreset(DATE_PRESETS.CLEAR)}
                >
                  Effacer
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[170px] border-none shadow-none focus:ring-0 font-medium" aria-label="Filtrer par statut">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <>
              <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Effacer
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
);

DevisFilters.displayName = "DevisFilters";
