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
            title: title || "No requests found",
            description:
              description ||
              "There are no devis requests to display at the moment.",
          };
        case "no-results":
          return {
            icon: <Search className="h-12 w-12 text-muted-foreground" />,
            title: title || "No results found",
            description:
              description || "Try adjusting your search criteria or filters.",
          };
        case "loading":
          return {
            icon: (
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            ),
            title: title || "Loading...",
            description: description || "Please wait while we load the data.",
          };
        default:
          return {
            icon: <FileText className="h-12 w-12 text-muted-foreground" />,
            title: title || "No data",
            description: description || "No data available.",
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
