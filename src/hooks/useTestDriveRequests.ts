/**
 * DEPRECATED — this hook used to be a hand-rolled duplicate of useTestDriveData.
 * It is no longer used anywhere in the codebase (Testdrive.tsx imports
 * useTestDriveData). Kept as a re-export to avoid breaking any external imports
 * that might still reference it.
 *
 * Prefer importing { useTestDriveData } from '@/hooks/useTestDriveData' directly.
 */
export { useTestDriveData as useTestDriveRequests } from "./useTestDriveData";
