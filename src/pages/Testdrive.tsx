import React, { useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { TestDriveRequest } from "@/types/testDrive";
import { useTestDriveData } from "@/hooks/useTestDriveData";
import { useTestDriveFilters } from "@/hooks/useTestDriveFilters";
import { useTestDriveActions } from "@/hooks/useTestDriveActions";
import { useTestDriveStats } from "@/hooks/useTestDriveStats";
import { TestDriveStats } from "@/components/testdrive/TestDriveStats";
import { TestDriveFilters } from "@/components/testdrive/TestDriveFilters";
import { TestDriveTable } from "@/components/testdrive/TestDriveTable";
import { TestDriveDialog } from "@/components/testdrive/TestDriveDialog";
import { TestDriveSkeleton } from "@/components/testdrive/TestDriveSkeleton";
import { useUser } from "@/context/UserContext";
import { useBrands, filterBrandOptions } from "@/lib/brands";

export default function Testdrive() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] =
    React.useState<TestDriveRequest | null>(null);

  // Custom hooks for data management
  const { requests, isLoading, error, refreshData, setRequests } =
    useTestDriveData();
  // Filters and search
  const {
    searchTerm,
    statusFilter,
    brandFilter,
    filteredRequests,
    brandFilteredRequests,
    updateSearchTerm,
    updateStatusFilter,
    updateBrandFilter,
    clearFilters,
    hasActiveFilters,
  } = useTestDriveFilters(requests);
  // Counters follow the brand filter (all assigned brands by default).
  const stats = useTestDriveStats(brandFilteredRequests);

  const { user } = useUser();
  const { brands } = useBrands();
  const brandOptions = useMemo(
    () =>
      filterBrandOptions(brands, {
        role: user?.role,
        userBrands: user?.brands,
        dataBrands: requests.map((r) => r.car_brand),
      }),
    [brands, user?.role, user?.brands, requests]
  );

  // Actions
  const {
    confirmRequest,
    completeRequest,
    cancelRequest,
    deleteRequest,
    isUpdating,
  } = useTestDriveActions(requests, setRequests, setSelectedRequest);

  // Memoized callbacks for performance
  const handleViewDetails = useCallback((request: TestDriveRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleConfirm = useCallback(
    async (requestId: string) => {
      const success = await confirmRequest(requestId);
      if (success) {
        handleCloseDialog();
      }
    },
    [confirmRequest, handleCloseDialog]
  );

  const handleComplete = useCallback(
    async (requestId: string) => {
      const success = await completeRequest(requestId);
      if (success) {
        handleCloseDialog();
      }
    },
    [completeRequest, handleCloseDialog]
  );

  const handleCancel = useCallback(
    async (requestId: string) => {
      const confirmed = window.confirm(
        "Voulez-vous vraiment annuler cette demande de test drive ?"
      );
      if (confirmed) {
        const success = await cancelRequest(requestId);
        if (success) {
          handleCloseDialog();
        }
      }
    },
    [cancelRequest, handleCloseDialog]
  );

  const handleDelete = useCallback(
    async (request: TestDriveRequest) => {
      const confirmed = window.confirm(
        `Supprimer la demande de test drive de ${request.full_name} ? Cette action est irréversible.`
      );
      if (confirmed) {
        await deleteRequest(request.id);
      }
    },
    [deleteRequest]
  );

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <TestDriveSkeleton />
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-destructive mb-4">Erreur : {error}</div>
          <button
            onClick={() => refreshData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Demandes de test drive
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Gérer les demandes d'essai et planifier les rendez-vous
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <TestDriveStats stats={stats} />

        {/* Filters */}
        <TestDriveFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={updateSearchTerm}
          onStatusFilterChange={updateStatusFilter}
          brandFilter={brandFilter}
          onBrandFilterChange={updateBrandFilter}
          brandOptions={brandOptions}
          allBrandsLabel={user?.role === "sales" ? "Toutes mes marques" : "Toutes les marques"}
        />

        {/* Test Drive Requests Table */}
        <TestDriveTable
          requests={filteredRequests}
          onViewDetails={handleViewDetails}
          onDelete={handleDelete}
          isUpdating={isUpdating}
          totalCount={requests.length}
        />

        {/* Test Drive Details Dialog */}
        {selectedRequest && (
          <TestDriveDialog
            request={selectedRequest}
            isOpen={isDialogOpen}
            onClose={handleCloseDialog}
            onConfirm={handleConfirm}
            onComplete={handleComplete}
            onCancel={handleCancel}
            isUpdating={isUpdating === selectedRequest?.id}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
