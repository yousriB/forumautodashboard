import React from "react";
import { FileText, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-data" | "no-results" | "loading";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ type, title, description, action, className }) => {
    const getContent = () => {
      switch (type) {
        case "no-data":
          return {
            icon: <FileText className="h-12 w-12 text-muted-foreground" />,
            title: title || "Aucune demande",
            description:
              description ||
              "Aucune demande de devis à afficher pour le moment.",
          };
        case "no-results":
          return {
            icon: <Search className="h-12 w-12 text-muted-foreground" />,
            title: title || "Aucun résultat",
            description:
              description || "Modifiez la recherche ou les filtres.",
          };
        case "loading":
          return {
            icon: (
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            ),
            title: title || "Chargement…",
            description: description || "Chargement des données en cours.",
          };
        default:
          return {
            icon: <FileText className="h-12 w-12 text-muted-foreground" />,
            title: title || "Aucune donnée",
            description: description || "Aucune donnée disponible.",
          };
      }
    };

    const content = getContent();

    return (
      <div
        className={`flex flex-col items-center justify-center py-12 px-4 text-center ${
          className || ""
        }`}
      >
        <div className="mb-4">{content.icon}</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {content.title}
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {content.description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
