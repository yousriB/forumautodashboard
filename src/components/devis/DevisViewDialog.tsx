import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { User, Car, Info, Mail, Phone, MapPin } from "lucide-react";
import { DevisRequest, DevisType, CAR_BRANDS } from "@/types/devis";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/utils/devisUtils";
import { VALIDATION } from "@/utils/constants";

interface DevisViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: DevisRequest | null;
  type: DevisType;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  editedData: Partial<DevisRequest>;
  onInputChange: (field: string, value: string) => void;
}

export const DevisViewDialog: React.FC<DevisViewDialogProps> = React.memo(
  ({
    isOpen,
    onClose,
    request,
    type,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    loading,
    editedData,
    onInputChange,
  }) => {
    if (!request) return null;

    const isCustom = type === "custom";
    const hasPrice = "car_price" in request;
    const hasRegion = "region" in request;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle>Devis Request Details</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Edit" : "View"} information for this {type}{" "}
                  devis request
                </DialogDescription>
              </div>
              {/*not hide the button of edit for all the devis request*/}
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="mt-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Full Name
                    </Label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editedData.first_name || ""}
                          onChange={(e) =>
                            onInputChange("first_name", e.target.value)
                          }
                          className="w-full"
                          maxLength={VALIDATION.MAX_NAME_LENGTH}
                        />
                        <Input
                          value={editedData.last_name || ""}
                          onChange={(e) =>
                            onInputChange("last_name", e.target.value)
                          }
                          className="w-full"
                          maxLength={VALIDATION.MAX_NAME_LENGTH}
                        />
                      </div>
                    ) : (
                      <p className="font-medium">
                        {request.first_name} {request.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      CIN/NF
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedData.cin_or_nf || ""}
                        onChange={(e) =>
                          onInputChange("cin_or_nf", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">{request.cin_or_nf}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Email
                    </Label>
                    {isEditing ? (
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={editedData.email || ""}
                          onChange={(e) =>
                            onInputChange("email", e.target.value)
                          }
                          className="pl-8"
                        />
                      </div>
                    ) : (
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {request.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Phone
                    </Label>
                    {isEditing ? (
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          value={editedData.phone_number || ""}
                          onChange={(e) =>
                            onInputChange("phone_number", e.target.value)
                          }
                          className="pl-8"
                        />
                      </div>
                    ) : (
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {request.phone_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Note
                    </Label>
                    {isEditing ? (
                      <textarea
                        value={editedData.note || ""}
                        onChange={(e) => onInputChange("note", e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                        maxLength={VALIDATION.MAX_NOTE_LENGTH}
                      />
                    ) : (
                      <p className="font-medium">
                        {request.note || "No note provided"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Payment Mode
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editedData.payment_mode || ""}
                        onValueChange={(value) =>
                          onInputChange("payment_mode", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="leasing">Leasing</SelectItem>
                          <SelectItem value="comptant">Comptant</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">
                        {request.payment_mode || "No payment mode provided"}
                      </p>
                    )}
                  </div>

                  {hasRegion && (
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Region
                      </Label>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {request.region || "No region specified"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Brand
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editedData.car_brand || ""}
                        onValueChange={(value) =>
                          onInputChange("car_brand", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAR_BRANDS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{request.car_brand}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Model
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedData.car_model || ""}
                        onChange={(e) =>
                          onInputChange("car_model", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">{request.car_model}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Version
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedData.car_version || ""}
                        onChange={(e) =>
                          onInputChange("car_version", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">{request.car_version}</p>
                    )}
                  </div>

                  {hasPrice && (
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Price
                      </Label>
                      <p className="font-medium text-lg">{request.car_price}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-1">
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Request Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Created At
                    </Label>
                    <p className="font-medium">
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Processed At
                    </Label>
                    <p className="font-medium">
                      {request.processed_at
                        ? formatDateTime(request.processed_at)
                        : "Not Processed"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Completed At
                    </Label>
                    <p className="font-medium">
                      {request.completed_at
                        ? formatDateTime(request.completed_at)
                        : "Not Completed"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Sold At
                    </Label>
                    <p className="font-medium">
                      {request.sold_at
                        ? formatDateTime(request.sold_at)
                        : "Not Sold"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Rejected At
                    </Label>
                    <p className="font-medium">
                      {request.rejected_at
                        ? formatDateTime(request.rejected_at)
                        : "Not Rejected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={onSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <a
                      href={`mailto:${request.email}?subject=Devis Request - ${request.car_brand} ${request.car_model}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`tel:${request.phone_number}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Customer
                    </a>
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

DevisViewDialog.displayName = "DevisViewDialog";
