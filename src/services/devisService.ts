import { supabase } from "@/lib/supabaseClient";
import {
    DevisRequest,
    StandardDevisRequest,
    CustomDevisRequest,
    DevisStatus,
    DevisType,
    DevisResponse,
    FilterOptions
} from "@/types/devis";
import { isValidStatusTransition, getLatestStatusDateObject } from "@/utils/devisUtils";

export class DevisService {
    /**
     * Fetch devis requests based on type and filters
     */
    static async fetchRequests(
        type: DevisType | 'all',
        filters?: FilterOptions,
        userRole?: string,
        userBrand?: string
    ): Promise<DevisResponse> {
        try {
            if (type === 'all') {
                return this.fetchAllRequests(filters, userRole, userBrand);
            }

            const tableName = type === "standard" ? "devis_requests" : "custom_devis_requests";

            let query = supabase
                .from(tableName)
                .select("*")
                .order("created_at", { ascending: false });

            // Apply user role filtering
            if (userRole === "sales" && userBrand) {
                query = query.eq("car_brand", userBrand);
            }

            // Apply filters
            if (filters) {
                if (filters.statusFilter && filters.statusFilter !== "all") {
                    query = query.eq("status", filters.statusFilter);
                }

                if (filters.brandFilter && filters.brandFilter !== "all") {
                    query = query.eq("car_brand", filters.brandFilter);
                }

                if (filters.dateRange?.from) {
                    query = query.gte("created_at", filters.dateRange.from.toISOString());
                }

                if (filters.dateRange?.to) {
                    const endDate = new Date(filters.dateRange.to);
                    endDate.setHours(23, 59, 59, 999);
                    query = query.lte("created_at", endDate.toISOString());
                }
            }

            const { data, error, count } = await query;

            if (error) {
                throw error;
            }

            // Add type property to each request
            const typedData = (data || []).map(item => ({ ...item, type }));

            return {
                data: typedData,
                count: count || 0,
            };
        } catch (error) {
            console.error(`Error fetching ${type} devis requests:`, error);
            return {
                data: [],
                count: 0,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Fetch all requests (standard and custom) and combine them
     */
    static async fetchAllRequests(
        filters?: FilterOptions,
        userRole?: string,
        userBrand?: string
    ): Promise<DevisResponse> {
        try {
            const [standardResponse, customResponse] = await Promise.all([
                this.fetchRequests('standard', filters, userRole, userBrand),
                this.fetchRequests('custom', filters, userRole, userBrand)
            ]);

            if (standardResponse.error) throw new Error(standardResponse.error);
            if (customResponse.error) throw new Error(customResponse.error);

            const allData = [...standardResponse.data, ...customResponse.data];

            // Sort combined data by created_at desc
            allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return {
                data: allData,
                count: allData.length
            };
        } catch (error) {
            console.error("Error fetching all devis requests:", error);
            return {
                data: [],
                count: 0,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Update devis request status
     */
    static async updateStatus(
        id: string,
        status: DevisStatus,
        type: DevisType,
        isAdmin: boolean
    ): Promise<{ success: boolean; error?: string; data?: DevisRequest }> {
        try {
            const tableName = type === "standard" ? "devis_requests" : "custom_devis_requests";

            // First, fetch the current request to validate the status transition
            const { data: currentRequestData, error: fetchError } = await supabase
                .from(tableName)
                .select("status")
                .eq("id", id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            if (!currentRequestData) {
                return { success: false, error: "Request not found." };
            }

            const currentStatus = currentRequestData.status as DevisStatus;

            if (!isValidStatusTransition(currentStatus, status, isAdmin)) {
                return { success: false, error: "Invalid status transition." };
            }

            // Only update the status. The trigger will handle timestamps.
            const updateData = {
                status,
            };

            const { data, error } = await supabase
                .from(tableName)
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data: data as DevisRequest };
        } catch (error) {
            console.error("Error updating devis status:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Delete devis request
     */
    static async deleteRequest(
        id: string,
        type: DevisType
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tableName = type === "standard" ? "devis_requests" : "custom_devis_requests";

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq("id", id);

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error("Error deleting devis request:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Update devis request data
     */
    static async updateRequest(
        id: string,
        data: Partial<DevisRequest>,
        type: DevisType
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tableName = type === "standard" ? "devis_requests" : "custom_devis_requests";

            const { error } = await supabase
                .from(tableName)
                .update(data)
                .eq("id", id);

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error("Error updating devis request:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Search requests by text
     */
    static filterRequests(
        requests: DevisRequest[],
        searchTerm: string
    ): DevisRequest[] {
        if (!searchTerm) return requests;

        const searchLower = searchTerm.toLowerCase();

        return requests.filter((request) => {
            return (
                (request.first_name?.toLowerCase() || '').includes(searchLower) ||
                (request.last_name?.toLowerCase() || '').includes(searchLower) ||
                (request.email?.toLowerCase() || '').includes(searchLower) ||
                (request.phone_number || '').includes(searchTerm) ||
                (request.car_brand?.toLowerCase() || '').includes(searchLower) ||
                (request.car_model?.toLowerCase() || '').includes(searchLower) ||
                (request.car_version?.toLowerCase() || '').includes(searchLower) ||
                (request.note?.toLowerCase() || '').includes(searchLower) ||
                (request.status?.toLowerCase() || '').includes(searchLower) ||
                ('region' in request && (request.region?.toLowerCase() || '').includes(searchLower))
            );
        });
    }

    /**
     * Check if request is within date range based on latest status date
     */
    static isRequestInDateRange(
        request: DevisRequest,
        dateRange?: { from: Date | undefined; to: Date | undefined }
    ): boolean {
        if (!dateRange?.from) return true;

        // Get the latest status date instead of just created_at
        const latestStatusDate = getLatestStatusDateObject(request);
        if (!latestStatusDate) return true; // If no valid date found, include the request

        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (!dateRange.to) {
            // If only start date is selected, include all requests from that day
            const toDate = new Date(fromDate);
            toDate.setDate(fromDate.getDate() + 1);
            return latestStatusDate >= fromDate && latestStatusDate < toDate;
        }

        // If both start and end dates are selected
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        return latestStatusDate >= fromDate && latestStatusDate <= toDate;
    }
}
