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

export class DevisService {
  /**
   * Fetch devis requests based on type and filters
   */
  static async fetchRequests(
    type: DevisType, 
    filters?: FilterOptions,
    userRole?: string,
    userBrand?: string
  ): Promise<DevisResponse> {
    try {
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

      return {
        data: data || [],
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
   * Update devis request status
   */
  static async updateStatus(
    id: string, 
    status: DevisStatus, 
    type: DevisType
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tableName = type === "standard" ? "devis_requests" : "custom_devis_requests";
      
      const updateData: any = {
        status,
        responded_at: new Date().toISOString(),
      };

      // Set appropriate timestamp based on status
      const now = new Date().toISOString();
      switch (status) {
        case 'processing':
          updateData.processed_at = now;
          break;
        case 'sold':
          updateData.sold_at = now;
          break;
        case 'rejected':
          updateData.rejected_at = now;
          break;
        case 'completed':
          updateData.completed_at = now;
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", id);

      if (error) {
        throw error;
      }

      return { success: true };
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
        request.first_name.toLowerCase().includes(searchLower) ||
        request.last_name.toLowerCase().includes(searchLower) ||
        request.email.toLowerCase().includes(searchLower) ||
        request.phone_number.includes(searchTerm) ||
        request.car_brand.toLowerCase().includes(searchLower) ||
        request.car_model.toLowerCase().includes(searchLower) ||
        request.car_version.toLowerCase().includes(searchLower) ||
        request.note.toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        ('region' in request && request.region.toLowerCase().includes(searchLower))
      );
    });
  }

  /**
   * Check if request is within date range
   */
  static isRequestInDateRange(
    request: DevisRequest,
    dateRange?: { from: Date | undefined; to: Date | undefined }
  ): boolean {
    if (!dateRange?.from) return true;
    
    const requestDate = new Date(request.created_at);
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    if (!dateRange.to) {
      // If only start date is selected, include all requests from that day
      const toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 1);
      return requestDate >= fromDate && requestDate < toDate;
    }
    
    // If both start and end dates are selected
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    
    return requestDate >= fromDate && requestDate <= toDate;
  }
}
