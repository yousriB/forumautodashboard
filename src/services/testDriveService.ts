import { supabase } from '@/lib/supabaseClient';
import { TestDriveRequest, TestDriveStatus } from '@/types/testDrive';
import { cleanTestDriveData } from '@/utils/testDriveUtils';

/**
 * Fetch all test drive requests from Supabase
 */
export const fetchTestDriveRequests = async (): Promise<TestDriveRequest[]> => {
  try {
    console.log('Fetching test drive requests...');
    const { data, error } = await supabase
      .from('test_drive_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching test drive requests:', error);
      throw error;
    }

    console.log('Fetched test drive requests:', data?.length || 0);
    // Clean up the data (trim status values)
    return data.map(cleanTestDriveData);
  } catch (error) {
    console.error('Error fetching test drive requests:', error);
    throw new Error('Failed to fetch test drive requests');
  }
};

/**
 * Update test drive request status
 */
export const updateTestDriveStatus = async (
  requestId: string, 
  newStatus: TestDriveStatus
): Promise<TestDriveRequest> => {
  try {
    // Validate inputs
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Invalid request ID provided');
    }
    
    if (!newStatus || !['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
      throw new Error('Invalid status provided');
    }

    console.log('Updating test drive status:', { 
      requestId, 
      newStatus, 
      requestIdType: typeof requestId,
      requestIdLength: requestId?.length 
    });
    
    // First, check if the record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('test_drive_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing record:', fetchError);
      throw new Error(`Record not found: ${fetchError.message}`);
    }

    console.log('Existing record found:', existingData);
    
    // Try a simple update first (just status)
    let { data, error } = await supabase
      .from('test_drive_requests')
      .update({ status: newStatus })
      .eq('id', requestId)
      .select()
      .single();

    // If that fails, try with updated_at
    if (error && error.code === 'PGRST116') {
      console.log('Retrying with updated_at field...');
      const updateData = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      const retryResult = await supabase
        .from('test_drive_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();
        
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log('Successfully updated test drive status:', data);
    return cleanTestDriveData(data);
  } catch (error) {
    console.error('Error updating test drive status:', error);
    throw new Error(`Failed to update test drive status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete test drive request
 */
export const deleteTestDriveRequest = async (requestId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('test_drive_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting test drive request:', error);
    throw new Error('Failed to delete test drive request');
  }
};

/**
 * Get test drive request by ID
 */
export const getTestDriveRequestById = async (requestId: string): Promise<TestDriveRequest> => {
  try {
    const { data, error } = await supabase
      .from('test_drive_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;

    return cleanTestDriveData(data);
  } catch (error) {
    console.error('Error fetching test drive request:', error);
    throw new Error('Failed to fetch test drive request');
  }
};

/**
 * Create new test drive request
 */
export const createTestDriveRequest = async (
  requestData: Omit<TestDriveRequest, 'id' | 'created_at' | 'updated_at'>
): Promise<TestDriveRequest> => {
  try {
    const { data, error } = await supabase
      .from('test_drive_requests')
      .insert([{
        ...requestData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return cleanTestDriveData(data);
  } catch (error) {
    console.error('Error creating test drive request:', error);
    throw new Error('Failed to create test drive request');
  }
};
