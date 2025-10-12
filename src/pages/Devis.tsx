import React, { useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/context/UserContext";
import {
  DevisStats,
  DevisFilters,
  DevisTable,
  DevisViewDialog,
  DevisErrorBoundary,
  EmptyState,
  LoadingSkeleton,
} from "@/components/devis";
import { useDevisRequests } from "@/hooks/useDevisRequests";
import { useDevisFilters } from "@/hooks/useDevisFilters";
import { useDevisPagination } from "@/hooks/useDevisPagination";
import { useDevisActions } from "@/hooks/useDevisActions";
import { useDebounce } from "@/hooks/useDebounce";
import { DevisRequest, DevisType } from "@/types/devis";
import { UI } from "@/utils/constants";

export default function Devis() {
  // State for dialogs
  const [selectedRequest, setSelectedRequest] = useState<DevisRequest | null>(
    null
  );
  const [requestType, setRequestType] = useState<DevisType>("standard");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<DevisRequest>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<{
    id: string;
    type: DevisType;
  } | null>(null);

  // Custom hooks for data management
  const standardRequests = useDevisRequests("standard");
  const customRequests = useDevisRequests("custom");

  // Debounced search term
  const debouncedSearchTerm = useDebounce(
    standardRequests.requests.length > 0
      ? standardRequests.requests
      : customRequests.requests,
    UI.DEBOUNCE_DELAY
  );

  // Filters for both types
  const standardFilters = useDevisFilters(standardRequests.requests);
  const customFilters = useDevisFilters(customRequests.requests);

  // Pagination for both types
  const standardPagination = useDevisPagination(
    standardFilters.filteredRequests
  );
  const customPagination = useDevisPagination(customFilters.filteredRequests);

  // Actions
  const standardActions = useDevisActions(
    standardRequests.updateRequest,
    standardRequests.removeRequest
  );
  const customActions = useDevisActions(
    customRequests.updateRequest,
    customRequests.removeRequest
  );

  // Combined stats for all requests
  const allRequests = useMemo(
    () => [...standardRequests.requests, ...customRequests.requests],
    [standardRequests.requests, customRequests.requests]
  );

  // Event handlers
  const handleViewRequest = useCallback(
    (request: DevisRequest, type: DevisType) => {
      setSelectedRequest(request);
      setRequestType(type);
      setEditedData({ ...request });
      setIsEditing(false);
      setIsViewDialogOpen(true);
    },
    []
  );

  const handleStatusChange = useCallback(
    (id: string, status: string, type: DevisType) => {
      const actions = type === "standard" ? standardActions : customActions;
      actions.updateStatus(id, status as any, type);
    },
    [standardActions, customActions]
  );

  const handleDeleteRequest = useCallback((id: string, type: DevisType) => {
    setDeletingRequest({ id, type });
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRequest) return;

    const actions =
      deletingRequest.type === "standard" ? standardActions : customActions;
    await actions.deleteRequest(deletingRequest.id, deletingRequest.type);

    setDeleteDialogOpen(false);
    setDeletingRequest(null);
  }, [deletingRequest, standardActions, customActions]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!selectedRequest) return;

    const actions =
      requestType === "standard" ? standardActions : customActions;
    await actions.updateRequestData(
      selectedRequest.id,
      editedData,
      requestType
    );

    setSelectedRequest((prev) => (prev ? { ...prev, ...editedData } : null));
    setIsEditing(false);
  }, [
    selectedRequest,
    requestType,
    editedData,
    standardActions,
    customActions,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (selectedRequest) {
      setEditedData({ ...selectedRequest });
      setIsEditing(false);
    }
  }, [selectedRequest]);

  return (
    <DashboardLayout>
      <DevisErrorBoundary>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Performa requests
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Manage customer quote requests and pricing inquiries
              </p>
            </div>
          </div>

          {/* Stats */}
          {standardRequests.loading || customRequests.loading ? (
            <LoadingSkeleton type="stats" />
          ) : (
            <DevisStats requests={allRequests} />
          )}

          {/* Filters */}
          {standardRequests.loading || customRequests.loading ? (
            <LoadingSkeleton type="filters" />
          ) : (
            <DevisFilters
              searchTerm={standardFilters.searchTerm}
              onSearchChange={standardFilters.setSearchTerm}
              statusFilter={standardFilters.statusFilter}
              onStatusChange={standardFilters.setStatusFilter}
              brandFilter={standardFilters.brandFilter}
              onBrandChange={standardFilters.setBrandFilter}
              dateRange={standardFilters.dateRange}
              onDateRangeChange={standardFilters.setDateRange}
              hasActiveFilters={standardFilters.hasActiveFilters}
              onClearFilters={standardFilters.clearFilters}
            />
          )}

          {/* Tabs for different types */}
          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard" className="text-sm">
                Standard Devis
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-sm">
                Custom Devis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              {standardRequests.loading ? (
                <LoadingSkeleton type="table" />
              ) : standardFilters.filteredRequests.length === 0 ? (
                <EmptyState
                  type={
                    standardFilters.hasActiveFilters ? "no-results" : "no-data"
                  }
                  title={
                    standardFilters.hasActiveFilters
                      ? "No results found"
                      : "No standard devis requests"
                  }
                  description={
                    standardFilters.hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "Standard devis requests will appear here when customers submit them."
                  }
                  action={
                    standardFilters.hasActiveFilters
                      ? {
                          label: "Clear Filters",
                          onClick: standardFilters.clearFilters,
                        }
                      : undefined
                  }
                />
              ) : (
                <DevisTable
                  requests={standardPagination.paginatedItems}
                  type="standard"
                  loading={standardActions.loading}
                  currentPage={standardPagination.currentPage}
                  totalPages={standardPagination.totalPages}
                  startIndex={standardPagination.startIndex}
                  endIndex={standardPagination.endIndex}
                  totalItems={standardPagination.totalItems}
                  onView={handleViewRequest}
                  onStatusChange={(id, status) =>
                    handleStatusChange(id, status, "standard")
                  }
                  onDelete={(id) => handleDeleteRequest(id, "standard")}
                  onPageChange={standardPagination.goToPage}
                  onNextPage={standardPagination.goToNextPage}
                  onPrevPage={standardPagination.goToPrevPage}
                  getPageNumbers={standardPagination.getPageNumbers}
                />
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              {customRequests.loading ? (
                <LoadingSkeleton type="table" />
              ) : customFilters.filteredRequests.length === 0 ? (
                <EmptyState
                  type={
                    customFilters.hasActiveFilters ? "no-results" : "no-data"
                  }
                  title={
                    customFilters.hasActiveFilters
                      ? "No results found"
                      : "No custom devis requests"
                  }
                  description={
                    customFilters.hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "Custom devis requests will appear here when customers submit them."
                  }
                  action={
                    customFilters.hasActiveFilters
                      ? {
                          label: "Clear Filters",
                          onClick: customFilters.clearFilters,
                        }
                      : undefined
                  }
                />
              ) : (
                <DevisTable
                  requests={customPagination.paginatedItems}
                  type="custom"
                  loading={customActions.loading}
                  currentPage={customPagination.currentPage}
                  totalPages={customPagination.totalPages}
                  startIndex={customPagination.startIndex}
                  endIndex={customPagination.endIndex}
                  totalItems={customPagination.totalItems}
                  onView={handleViewRequest}
                  onStatusChange={(id, status) =>
                    handleStatusChange(id, status, "custom")
                  }
                  onDelete={(id) => handleDeleteRequest(id, "custom")}
                  onPageChange={customPagination.goToPage}
                  onNextPage={customPagination.goToNextPage}
                  onPrevPage={customPagination.goToPrevPage}
                  getPageNumbers={customPagination.getPageNumbers}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* View Request Dialog */}
          <DevisViewDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setIsEditing(false);
            }}
            request={selectedRequest}
            type={requestType}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSaveChanges}
            onCancel={handleCancelEdit}
            loading={standardActions.loading || customActions.loading}
            editedData={editedData}
            onInputChange={handleInputChange}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  request and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={standardActions.loading || customActions.loading}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={standardActions.loading || customActions.loading}
                >
                  {standardActions.loading || customActions.loading
                    ? "Deleting..."
                    : "Delete Permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DevisErrorBoundary>
    </DashboardLayout>
  );
}
