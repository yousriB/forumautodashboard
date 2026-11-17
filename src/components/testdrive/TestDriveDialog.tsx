import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TestDriveRequest, TestDriveStatus } from "@/types/testDrive";
import { STATUS_COLORS, STATUS_ICONS } from "@/constants/testDrive";
import { formatDate } from "@/utils/testDriveUtils";
import { TestDriveActions } from "./TestDriveActions";
import { TEST_DRIVE_STATUS_LABELS } from "@/lib/reports/types";

interface TestDriveDialogProps {
  request: TestDriveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
  onComplete: (requestId: string) => void;
  onCancel: (requestId: string) => void;
  isUpdating?: boolean;
}

export const TestDriveDialog = React.memo<TestDriveDialogProps>(
  ({
    request,
    isOpen,
    onClose,
    onConfirm,
    onComplete,
    onCancel,
    isUpdating = false,
  }) => {
    if (!request) return null;

    const StatusIcon = STATUS_ICONS[request.status];

    const handleConfirm = React.useCallback(() => {
      onConfirm(request.id);
    }, [request.id, onConfirm]);

    const handleComplete = React.useCallback(() => {
      onComplete(request.id);
    }, [request.id, onComplete]);

    const handleCancel = React.useCallback(() => {
      onCancel(request.id);
    }, [request.id, onCancel]);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Détails de la demande de test drive
            </DialogTitle>
            <DialogDescription className="text-sm">
              Gérer cette demande de test drive
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Information */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-foreground text-sm sm:text-base">
                  Informations client
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Nom complet
                    </label>
                    <p className="font-medium text-sm sm:text-base">
                      {request.full_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Email
                    </label>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {request.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Téléphone
                    </label>
                    <p className="font-medium text-sm sm:text-base">
                      {request.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-foreground text-sm sm:text-base">
                  Détails de la demande
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Modèle
                    </label>
                    <p className="font-medium text-sm sm:text-base">
                      {request.car_model}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Date de la demande
                    </label>
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(request.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      Statut actuel
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={`${
                          STATUS_COLORS[request.status]
                        } text-xs sm:text-sm`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {TEST_DRIVE_STATUS_LABELS[request.status] ?? request.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <TestDriveActions
              request={request}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
              onCancel={handleCancel}
              isUpdating={isUpdating}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

TestDriveDialog.displayName = "TestDriveDialog";
