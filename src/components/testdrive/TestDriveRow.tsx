import React from "react";
import { Mail, Phone, Car, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { TestDriveRequest } from "@/types/testDrive";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  TABLE_CONSTANTS,
} from "@/constants/testDrive";
import { formatDate, formatTime } from "@/utils/testDriveUtils";

interface TestDriveRowProps {
  request: TestDriveRequest;
  onViewDetails: (request: TestDriveRequest) => void;
  isUpdating?: boolean;
}

export const TestDriveRow = React.memo<TestDriveRowProps>(
  ({ request, onViewDetails, isUpdating = false }) => {
    const StatusIcon = STATUS_ICONS[request.status];

    const handleViewDetails = React.useCallback(() => {
      onViewDetails(request);
    }, [request, onViewDetails]);

    return (
      <TableRow className="table-row-hover">
        <TableCell>
          <div>
            <div className="font-medium text-foreground">
              {request.full_name}
            </div>
            <div className="sm:hidden mt-1 space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{request.email}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {request.phone}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="hidden sm:table-cell">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span
                className="truncate"
                style={{ maxWidth: `${TABLE_CONSTANTS.MAX_EMAIL_WIDTH}px` }}
              >
                {request.email}
              </span>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {request.phone}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{request.car_model}</span>
          </div>
        </TableCell>

        <TableCell className="text-muted-foreground hidden md:table-cell">
          <div className="text-sm">
            <div>{formatDate(request.created_at)}</div>
            <div className="text-xs opacity-75">
              {formatTime(request.created_at)}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge className={STATUS_COLORS[request.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {request.status}
          </Badge>
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              disabled={isUpdating}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

TestDriveRow.displayName = "TestDriveRow";
