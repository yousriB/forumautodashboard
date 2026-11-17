import React from "react";
import { Search, Filter } from "lucide-react";
import type { BrandInfo } from "@/lib/brands";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TestDriveFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  brandFilter: string;
  onBrandFilterChange: (value: string) => void;
  brandOptions: BrandInfo[];
  allBrandsLabel?: string;
}

export const TestDriveFilters = React.memo<TestDriveFiltersProps>(
  ({
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    brandFilter,
    onBrandFilterChange,
    brandOptions,
    allBrandsLabel = "Toutes les marques",
  }) => {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone ou modèle…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 input-field"
          />
        </div>

        <Select value={brandFilter} onValueChange={onBrandFilterChange}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrer par marque">
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

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="completed">Effectué</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
);

TestDriveFilters.displayName = "TestDriveFilters";
