import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, Trash, Car, DollarSign } from "lucide-react";
import { DevisRequest, DevisType } from "@/types/devis";
import { StatusBadge } from "./StatusBadge";
import {
  formatDate,
  getAvailableStatusTransitions,
  getLatestStatusDate,
} from "@/utils/devisUtils";
import { useUser } from "@/context/UserContext";

interface DevisRowProps {
  request: DevisRequest;
  type: DevisType;
  loading: boolean;
  onView: (request: DevisRequest, type: DevisType) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string, type: DevisType) => void;
}

export const DevisRow: React.FC<DevisRowProps> = React.memo(
  ({ request, type, loading, onView, onStatusChange, onDelete }) => {
    const { user } = useUser();
    const availableTransitions = getAvailableStatusTransitions(
      request.status,
      user?.role === "admin"
    );

    const handleStatusChange = React.useCallback(
      (value: string) => {
        onStatusChange(request.id, value);
      },
      [request.id, onStatusChange]
    );

    const handleDelete = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(request.id, type);
      },
      [request.id, type, onDelete]
    );

    const handleView = React.useCallback(() => {
      onView(request, type);
    }, [request, type, onView]);

    return (
      <TableRow className="table-row-hover">
        <TableCell>
          <div>
            <div className="font-medium text-foreground">
              {request.first_name} {request.last_name}
            </div>
            <div className="text-sm text-muted-foreground">
              CIN: {request.cin_or_nf}
            </div>
            {/* Mobile-only info */}
            <div className="md:hidden mt-2 space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" />
                {request.car_brand} {request.car_model}
              </div>
              {"car_price" in request && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {request.car_price}
                </div>
              )}
              {"region" in request && (
                <div className="text-xs text-muted-foreground">
                  {request.region || "No region specified"}
                </div>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {request.car_brand} {request.car_model}
              </div>
              <div className="text-sm text-muted-foreground">
                {request.car_version}
              </div>
            </div>
          </div>
        </TableCell>

        {"car_price" in request && (
          <TableCell className="hidden lg:table-cell">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.car_price}</span>
            </div>
          </TableCell>
        )}

        {"region" in request && (
          <TableCell className="hidden lg:table-cell">
            <span className="font-medium">
              {request.region || "No region specified"}
            </span>
          </TableCell>
        )}

        <TableCell className="hidden sm:table-cell">
          <div className="text-sm space-y-1">
            <div className="truncate max-w-[150px]">{request.email}</div>
            <div className="text-muted-foreground">{request.phone_number}</div>
          </div>
        </TableCell>

        <TableCell className="hidden sm:table-cell">
          <span className="line-clamp-2">{request.note}</span>
        </TableCell>

        <TableCell>
          <StatusBadge status={request.status} />
        </TableCell>

        <TableCell className="text-muted-foreground hidden sm:table-cell">
          {getLatestStatusDate(request)}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={handleView}>
              <Eye className="h-4 w-4" />
            </Button>

            <Select
              value={request.status}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.length > 0 ? (
                  availableTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "processing" && "Processing"}
                      {status === "completed" && "Complete"}
                      {status === "sold" && "Mark as Sold"}
                      {status === "rejected" && "Reject"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={request.status} disabled>
                    {request.status === "rejected" && "Rejected"}
                    {request.status === "sold" && "Sold"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

DevisRow.displayName = "DevisRow";
