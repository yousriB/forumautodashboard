import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DevisRequest, DevisType } from "@/types/devis";
import { DevisRow } from "./DevisRow";

interface DevisTableProps {
  requests: DevisRequest[];
  type: DevisType;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onView: (request: DevisRequest, type: DevisType) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string, type: DevisType) => void;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  getPageNumbers: () => number[];
  className?: string;
}

export const DevisTable: React.FC<DevisTableProps> = React.memo(
  ({
    requests,
    type,
    loading,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    onView,
    onStatusChange,
    onDelete,
    onPageChange,
    onNextPage,
    onPrevPage,
    getPageNumbers,
    className,
  }) => {
    const isStandard = type === "standard";

    return (
      <div className={`dashboard-card ${className || ""}`}>
        <div className="overflow-x-auto">
          <Table className={isStandard ? undefined : "min-w-[600px]"}>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                {isStandard ? (
                  <TableHead className="hidden lg:table-cell">Price</TableHead>
                ) : (
                  <TableHead className="hidden lg:table-cell">Region</TableHead>
                )}
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="hidden sm:table-cell">Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <DevisRow
                  key={request.id}
                  request={request}
                  type={type}
                  loading={loading}
                  onView={onView}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={onPrevPage}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers().map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={onNextPage}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DevisTable.displayName = "DevisTable";
