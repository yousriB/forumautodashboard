import React from "react";
import { Car, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestDriveEmptyStateProps {
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

export const TestDriveEmptyState = React.memo<TestDriveEmptyStateProps>(
  ({ onClearFilters, hasFilters = false }) => {
    return (
      <div className="dashboard-card">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-muted p-6 mb-4">
            {hasFilters ? (
              <Search className="h-12 w-12 text-muted-foreground" />
            ) : (
              <Car className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            {hasFilters ? "Aucun test drive trouvé" : "Aucune demande de test drive pour le moment"}
          </h3>

          <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
            {hasFilters
              ? "Modifiez la recherche ou les filtres pour trouver des demandes."
              : "Les demandes d'essai envoyées par les clients apparaîtront ici."}
          </p>

          {hasFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>
    );
  }
);

TestDriveEmptyState.displayName = "TestDriveEmptyState";
