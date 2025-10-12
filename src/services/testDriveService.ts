import { supabase } from '@/lib/supabaseClient';
import { TestDriveRequest, TestDriveStatus } from '@/types/testDrive';
import { cleanTestDriveData } from '@/utils/testDriveUtils';

/**
 * Fetch all test drive requests from Supabase
 */
export const fetchTestDriveRequests = async (): Promise<TestDriveRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('test_drive_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('test_drive_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return cleanTestDriveData(data);
  } catch (error) {
    console.error('Error updating test drive status:', error);
    throw new Error('Failed to update test drive status');
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
