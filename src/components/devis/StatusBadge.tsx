import React from "react";
import { Badge } from "@/components/ui/badge";
import { DevisStatus } from "@/types/devis";
import { getStatusColor, getStatusLabel } from "@/utils/devisUtils";

interface StatusBadgeProps {
  status: DevisStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(
  ({ status, className }) => {
    return (
      <Badge className={`${getStatusColor(status)} ${className || ""}`}>
        {getStatusLabel(status)}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
