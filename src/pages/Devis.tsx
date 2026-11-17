import React, { useState, useCallback, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { useBrands, filterBrandOptions } from "@/lib/brands";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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

import { DevisRequest, DevisType } from "@/types/devis";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";



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



  // Fetch all requests

  const {

    requests,

    loading,

    updateRequest,

    removeRequest

  } = useDevisRequests("all");



  // Filters

  const filters = useDevisFilters(requests);

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



  // Pagination

  const pagination = useDevisPagination(filters.filteredRequests);



  // Actions

  const actions = useDevisActions(updateRequest, removeRequest);



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

    (id: string, status: string) => {

      const request = requests.find(r => r.id === id);

      if (!request) return;



      const type = request.type || "standard";

      actions.updateStatus(id, status as any, type);

    },

    [actions, requests]

  );



  const handleDeleteRequest = useCallback((id: string) => {

    const request = requests.find(r => r.id === id);

    if (!request) return;



    const type = request.type || "standard";

    setDeletingRequest({ id, type });

    setDeleteDialogOpen(true);

  }, [requests]);



  const handleConfirmDelete = useCallback(async () => {

    if (!deletingRequest) return;



    await actions.deleteRequest(deletingRequest.id, deletingRequest.type);



    setDeleteDialogOpen(false);

    setDeletingRequest(null);

  }, [deletingRequest, actions]);



  const handleInputChange = useCallback((field: string, value: string) => {

    setEditedData((prev) => ({

      ...prev,

      [field]: value,

    }));

  }, []);



  const handleSaveChanges = useCallback(async () => {

    if (!selectedRequest) return;



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

    actions,

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

            <div>

              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">

                Demandes de devis

              </h1>

              <p className="text-muted-foreground mt-1">

                Suivre et traiter les demandes de devis des clients

              </p>

            </div>

          </div>



          {/* Stats */}

          {loading ? (

            <LoadingSkeleton type="stats" />

          ) : (

            <DevisStats requests={filters.filteredRequests} />

          )}



          {/* Filters */}

          {loading ? (

            <LoadingSkeleton type="filters" />

          ) : (

            <DevisFilters

              searchTerm={filters.searchTerm}

              onSearchChange={filters.setSearchTerm}

              statusFilter={filters.statusFilter}

              onStatusChange={filters.setStatusFilter}

              brandFilter={filters.brandFilter}

              onBrandChange={filters.setBrandFilter}
              brandOptions={brandOptions}
              allBrandsLabel={user?.role === "sales" ? "Toutes mes marques" : "Toutes les marques"}

              dateRange={filters.dateRange}

              onDateRangeChange={filters.setDateRange}

              hasActiveFilters={filters.hasActiveFilters}

              onClearFilters={filters.clearFilters}

            />

          )}



          {/* Table */}

          {loading ? (

            <LoadingSkeleton type="table" />

          ) : filters.filteredRequests.length === 0 ? (

            <Card>

              <CardContent className="p-6">

                <EmptyState

                  type={

                    filters.hasActiveFilters ? "no-results" : "no-data"

                  }

                  title={

                    filters.hasActiveFilters

                      ? "Aucun résultat"

                      : "Aucune demande de devis"

                  }

                  description={

                    filters.hasActiveFilters

                      ? "Modifiez les filtres pour afficher plus de résultats."

                      : "Les demandes de devis apparaîtront ici dès que des clients en enverront."

                  }

                  action={

                    filters.hasActiveFilters

                      ? {

                        label: "Effacer les filtres",

                        onClick: filters.clearFilters,

                      }

                      : undefined

                  }

                />

              </CardContent>

            </Card>

          ) : (

            <Card className="shadow-none bg-transparent">

              <DevisTable

                requests={pagination.paginatedItems}

                type="all"

                loading={actions.loading}

                currentPage={pagination.currentPage}

                totalPages={pagination.totalPages}

                startIndex={pagination.startIndex}

                endIndex={pagination.endIndex}

                totalItems={pagination.totalItems}

                onView={handleViewRequest}

                onStatusChange={handleStatusChange}

                onDelete={handleDeleteRequest}

                onPageChange={pagination.goToPage}

                onNextPage={pagination.goToNextPage}

                onPrevPage={pagination.goToPrevPage}

                getPageNumbers={pagination.getPageNumbers}

              />

            </Card>

          )}



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

            loading={actions.loading}

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

                <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>

                <AlertDialogDescription>

                  Cette action est irréversible : la demande et toutes ses données seront supprimées définitivement.

                </AlertDialogDescription>

              </AlertDialogHeader>

              <AlertDialogFooter>

                <AlertDialogCancel

                  disabled={actions.loading}

                >

                  Annuler

                </AlertDialogCancel>

                <AlertDialogAction

                  onClick={handleConfirmDelete}

                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

                  disabled={actions.loading}

                >

                  {actions.loading

                    ? "Suppression…"

                    : "Supprimer définitivement"}

                </AlertDialogAction>

              </AlertDialogFooter>

            </AlertDialogContent>

          </AlertDialog>

        </div>

      </DevisErrorBoundary>

    </DashboardLayout>

  );

}