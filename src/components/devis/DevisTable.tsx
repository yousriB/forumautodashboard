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
import { Card, CardContent } from "@/components/ui/card";
import { DevisRequest, DevisType } from "@/types/devis";
import { DevisRow } from "./DevisRow";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface DevisTableProps {
  requests: DevisRequest[];
  type: DevisType | 'all';
  loading: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onView: (request: DevisRequest, type: DevisType) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  getPageNumbers: () => (number | string)[];
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
    if (loading) {
      return <LoadingSkeleton type="table" />;
    }

    return (
      <Card className={`shadow-md border-gray-200 rounded-xl ${className || ""}`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-gray-50/70 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Customer</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-gray-700 dark:text-gray-300">Vehicle</TableHead>
                  {/* Show Price column if type is standard or all (and request has price) */}
                  {(type === "standard" || type === "all") && (
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-700 dark:text-gray-300">Price</TableHead>
                  )}
                  {/* Show Region column if type is custom or all (and request has region) */}
                  {(type === "custom" || type === "all") && (
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-700 dark:text-gray-300">Region</TableHead>
                  )}
                  <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Note</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <DevisRow
                    key={request.id}
                    request={request}
                    type={request.type}
                    loading={loading}
                    onView={onView}
                    onStatusChange={onStatusChange}
                    onDelete={(id, type) => onDelete(id)}
                  />
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min(endIndex, totalItems)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> results
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={onPrevPage}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50 text-gray-400 dark:text-gray-600"
                            : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers().map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === '...' ? (
                          <span className="px-3 py-1 text-gray-500 dark:text-gray-400">...</span>
                        ) : (
                          <PaginationLink
                            isActive={currentPage === pageNum}
                            onClick={() => onPageChange(pageNum as number)}
                            className={`cursor-pointer ${currentPage === pageNum
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                              } rounded-md`}
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={onNextPage}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50 text-gray-400 dark:text-gray-600"
                            : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

DevisTable.displayName = "DevisTable";