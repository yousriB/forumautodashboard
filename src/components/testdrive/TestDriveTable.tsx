import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TestDriveRequest } from "@/types/testDrive";
import { TestDriveRow } from "./TestDriveRow";
import { TestDriveEmptyState } from "./TestDriveEmptyState";

interface TestDriveTableProps {
  requests: TestDriveRequest[];
  onViewDetails: (request: TestDriveRequest) => void;
  isUpdating?: string | null;
  totalCount: number;
}

export const TestDriveTable = React.memo<TestDriveTableProps>(
  ({ requests, onViewDetails, isUpdating, totalCount }) => {
    if (requests.length === 0) {
      return <TestDriveEmptyState />;
    }

    return (
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead>Car Model</TableHead>
                <TableHead className="hidden md:table-cell">
                  Request Date
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TestDriveRow
                  key={request.id}
                  request={request}
                  onViewDetails={onViewDetails}
                  isUpdating={isUpdating === request.id}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {requests.length} of {totalCount} requests
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

TestDriveTable.displayName = "TestDriveTable";
