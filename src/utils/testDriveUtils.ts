import { TestDriveRequest, TestDriveStats, TestDriveFilters } from '@/types/testDrive';

/**
 * Clean and validate test drive request data
 */
export const cleanTestDriveData = (request: TestDriveRequest): TestDriveRequest => {
  return {
    ...request,
    status: request.status.trim() as TestDriveRequest['status'],
    full_name: request.full_name?.trim() || '',
    email: request.email?.trim() || '',
    phone: request.phone?.trim() || '',
    car_model: request.car_model?.trim() || ''
  };
};

/**
 * Filter test drive requests based on search term and status
 */
export const filterTestDriveRequests = (
  requests: TestDriveRequest[],
  filters: TestDriveFilters
): TestDriveRequest[] => {
  return requests.filter((request) => {
    if (!request) return false;
    
    // Clean the status by trimming any whitespace
    const cleanStatus = request.status.trim();
    
    // If search term is provided, check if it matches any field
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        (request.full_name?.toLowerCase().includes(searchLower) ||
         request.email?.toLowerCase().includes(searchLower) ||
         request.car_model?.toLowerCase().includes(searchLower) ||
         request.phone?.includes(filters.searchTerm)) ?? false;
      
      if (!matchesSearch) return false;
    }
    
    // Apply status filter if not 'all'
    if (filters.statusFilter !== "all" && cleanStatus !== filters.statusFilter) {
      return false;
    }
    
    return true;
  });
};

/**
 * Calculate statistics from test drive requests
 */
export const calculateTestDriveStats = (requests: TestDriveRequest[]): TestDriveStats => {
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };
};

/**
 * Filter requests by brand for sales users
 */
export const filterByBrand = (
  requests: TestDriveRequest[], 
  brand: string
): TestDriveRequest[] => {
  if (!brand) return requests;
  
  const brandLower = brand.toLowerCase();
  return requests.filter(request => 
    request.car_model && request.car_model.toLowerCase().includes(brandLower)
  );
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format time for display
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Generate email body for test drive request
 */
export const generateEmailBody = (request: TestDriveRequest): string => {
  return `Dear ${request.full_name},

Thank you for your test drive request for the ${request.car_model}.

We will contact you soon to schedule your test drive appointment.

Best regards,
AutoDealer Team`;
};

/**
 * Generate email subject for test drive request
 */
export const generateEmailSubject = (request: TestDriveRequest): string => {
  return `Test Drive Request - ${request.car_model}`;
};
