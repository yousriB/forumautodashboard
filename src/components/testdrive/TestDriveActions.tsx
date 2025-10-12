import React from "react";
import { Calendar, CheckCircle, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestDriveRequest, TestDriveStatus } from "@/types/testDrive";
import { STATUS_COLORS, STATUS_ICONS } from "@/constants/testDrive";
import {
  generateEmailBody,
  generateEmailSubject,
} from "@/utils/testDriveUtils";

interface TestDriveActionsProps {
  request: TestDriveRequest;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
}

export const TestDriveActions = React.memo<TestDriveActionsProps>(
  ({ request, onConfirm, onComplete, onCancel, isUpdating = false }) => {
    const StatusIcon = STATUS_ICONS[request.status];
    const canCancel =
      request.status === "pending" || request.status === "confirmed";

    const handleConfirm = React.useCallback(() => {
      if (!isUpdating) {
        onConfirm();
      }
    }, [onConfirm, isUpdating]);

    const handleComplete = React.useCallback(() => {
      if (!isUpdating) {
        onComplete();
      }
    }, [onComplete, isUpdating]);

    const handleCancel = React.useCallback(() => {
      if (!isUpdating && canCancel) {
        onCancel();
      }
    }, [onCancel, isUpdating, canCancel]);

    return (
      <div className="space-y-3 border-t pt-4">
        <h4 className="font-medium text-foreground text-sm sm:text-base">
          Quick Actions
        </h4>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {request.status === "pending" && (
            <Button
              onClick={handleConfirm}
              disabled={isUpdating}
              className="flex items-center gap-1 text-sm"
            >
              <Calendar className="h-4 w-4" />
              Confirm Request
            </Button>
          )}

          {request.status === "confirmed" && (
            <Button
              onClick={handleComplete}
              disabled={isUpdating}
              className="flex items-center gap-1 text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Completed
            </Button>
          )}

          <Button
            variant="outline"
            asChild
            className="text-sm"
            disabled={isUpdating}
          >
            <a
              href={`mailto:${request.email}?subject=${encodeURIComponent(
                generateEmailSubject(request)
              )}&body=${encodeURIComponent(generateEmailBody(request))}`}
            >
              <Mail className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Send Email</span>
              <span className="sm:hidden">Email</span>
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="text-sm"
            disabled={isUpdating}
          >
            <a href={`tel:${request.phone}`}>
              <Phone className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Call Customer</span>
              <span className="sm:hidden">Call</span>
            </a>
          </Button>

          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex items-center gap-1 text-sm"
            >
              <X className="h-4 w-4" />
              Cancel Request
            </Button>
          )}
        </div>
      </div>
    );
  }
);

TestDriveActions.displayName = "TestDriveActions";
