import { supabase } from '@/lib/supabaseClient';
import { TestDriveRequest, TestDriveStatus } from '@/types/testDrive';
import { cleanTestDriveData } from '@/utils/testDriveUtils';

/**
 * Fetch all test drive requests from Supabase.
 *
 * Accepts an optional AbortSignal so React Query can cancel in-flight
 * requests when the component unmounts.
 */
export const fetchTestDriveRequests = async (
  signal?: AbortSignal
): Promise<TestDriveRequest[]> => {
  try {
    let query = supabase
      .from('test_drive_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching test drive requests:', error);
      throw error;
    }

    return (data ?? []).map(cleanTestDriveData);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    console.error('Error fetching test drive requests:', error);
    throw new Error('Failed to fetch test drive requests');
  }
};

/**
 * Update test drive request status via the update_test_drive_status RPC.
 *
 * Previously this was a SELECT followed by an UPDATE (and a stale PGRST116
 * retry path that also fired a second write). The RPC does it in one call.
 */
export const updateTestDriveStatus = async (
  requestId: string,
  newStatus: TestDriveStatus
): Promise<TestDriveRequest> => {
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('Invalid request ID provided');
  }

  if (!newStatus || !['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
    throw new Error('Invalid status provided');
  }

  const { data, error } = await supabase.rpc('update_test_drive_status', {
    p_id: requestId,
    p_new_status: newStatus,
  });

  if (error) {
    console.error('Supabase error details:', error);
    throw new Error(`Failed to update test drive status: ${error.message}`);
  }

  return cleanTestDriveData(data as TestDriveRequest);
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
