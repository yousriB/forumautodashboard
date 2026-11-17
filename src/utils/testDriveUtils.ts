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

    if (filters.brandFilter && filters.brandFilter !== "all" && request.car_brand !== filters.brandFilter) {
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
 * Keep only the requests of one brand ("all" keeps everything).
 */
export const filterByBrand = (
  requests: TestDriveRequest[],
  brand: string
): TestDriveRequest[] => {
  if (!brand || brand === "all") return requests;
  return requests.filter((request) => request.car_brand === brand);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("fr-FR");
};

/**
 * Format time for display
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("fr-FR", { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Generate email body for test drive request
 */
export const generateEmailBody = (request: TestDriveRequest): string => {
  return `Bonjour ${request.full_name},

Merci pour votre demande d'essai du ${request.car_model}.

Nous vous contacterons très prochainement pour fixer la date de votre essai.

Cordialement,
Forum Auto Gabès`;
};

/**
 * Generate email subject for test drive request
 */
export const generateEmailSubject = (request: TestDriveRequest): string => {
  return `Demande de test drive - ${request.car_model}`;
};
