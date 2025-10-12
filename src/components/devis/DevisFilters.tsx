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
import { CAR_BRANDS } from "@/types/devis";
import { DATE_PRESETS, UI } from "@/utils/constants";

interface DevisFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  brandFilter: string;
  onBrandChange: (value: string) => void;
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
      <div className={`flex flex-col sm:flex-row gap-4 ${className || ""}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or car details..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 input-field"
            maxLength={UI.MAX_SEARCH_LENGTH}
          />
        </div>

        <Select value={brandFilter} onValueChange={onBrandChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {CAR_BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full hidden sm:w-48 sm:flex justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} -{" "}
                    {format(dateRange.to, "MMM d, y")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, y")
                )
              ) : (
                <span>Date range</span>
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
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleDatePreset(DATE_PRESETS.YESTERDAY)}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleDatePreset(DATE_PRESETS.LAST_7_DAYS)}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleDatePreset(DATE_PRESETS.LAST_30_DAYS)}
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleDatePreset(DATE_PRESETS.CLEAR)}
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  }
);

DevisFilters.displayName = "DevisFilters";
