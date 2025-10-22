import { useState, useCallback } from 'react';
import { TestDriveRequest, TestDriveStatus } from '@/types/testDrive';
import { updateTestDriveStatus, deleteTestDriveRequest } from '@/services/testDriveService';
import { useToast } from '@/hooks/use-toast';

export const useTestDriveActions = (
  requests: TestDriveRequest[],
  setRequests: React.Dispatch<React.SetStateAction<TestDriveRequest[]>>,
  setSelectedRequest?: React.Dispatch<React.SetStateAction<TestDriveRequest | null>>
) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const updateStatus = useCallback(async (
    requestId: string, 
    newStatus: TestDriveStatus
  ): Promise<boolean> => {
    setIsUpdating(requestId);
    
    try {
      // Optimistic update
      const updatedRequest = requests.find(r => r.id === requestId);
      if (updatedRequest) {
        const optimisticUpdate = { ...updatedRequest, status: newStatus };
        
        setRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId ? optimisticUpdate : request
          )
        );

        // Update selected request if it's the one being updated
        if (setSelectedRequest) {
          setSelectedRequest(prev => 
            prev?.id === requestId ? optimisticUpdate : prev
          );
        }
      }

      // Update in Supabase
      await updateTestDriveStatus(requestId, newStatus);

      // Show success toast
      toast({
        title: "Status Updated",
        description: `Test drive request ${newStatus} successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Revert optimistic update on error
      const originalRequest = requests.find(r => r.id === requestId);
      if (originalRequest) {
        setRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId ? originalRequest : request
          )
        );

        if (setSelectedRequest) {
          setSelectedRequest(prev => 
            prev?.id === requestId ? originalRequest : prev
          );
        }
      }

      // Show error toast
      toast({
        title: "Update Failed",
        description: "Failed to update test drive status. Please try again.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsUpdating(null);
    }
  }, [requests, setRequests, setSelectedRequest, toast]);

  const confirmRequest = useCallback(async (requestId: string) => {
    return updateStatus(requestId, 'confirmed');
  }, [updateStatus]);

  const completeRequest = useCallback(async (requestId: string) => {
    return updateStatus(requestId, 'completed');
  }, [updateStatus]);

  const cancelRequest = useCallback(async (requestId: string) => {
    return updateStatus(requestId, 'cancelled');
  }, [updateStatus]);

  const deleteRequest = useCallback(async (requestId: string): Promise<boolean> => {
    setIsUpdating(requestId);
    
    // Store the request to delete for potential rollback
    const requestToDelete = requests.find(r => r.id === requestId);
    
    try {
      // Optimistic update - remove from local state
      if (requestToDelete) {
        setRequests(prevRequests =>
          prevRequests.filter(request => request.id !== requestId)
        );

        // Clear selected request if it's the one being deleted
        if (setSelectedRequest) {
          setSelectedRequest(prev => 
            prev?.id === requestId ? null : prev
          );
        }
      }

      // Delete from Supabase
      await deleteTestDriveRequest(requestId);

      // Show success toast
      toast({
        title: "Request Deleted",
        description: "Test drive request has been deleted successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      
      // Revert optimistic update on error
      if (requestToDelete) {
        setRequests(prevRequests => [...prevRequests, requestToDelete].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }

      // Show error toast
      toast({
        title: "Delete Failed",
        description: "Failed to delete test drive request. Please try again.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsUpdating(null);
    }
  }, [requests, setRequests, setSelectedRequest, toast]);

  return {
    updateStatus,
    confirmRequest,
    completeRequest,
    cancelRequest,
    deleteRequest,
    isUpdating
  };
};
