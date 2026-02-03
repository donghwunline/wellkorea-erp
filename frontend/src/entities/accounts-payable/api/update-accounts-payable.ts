/**
 * Update Accounts Payable metadata command function.
 *
 * Allows updating due date and notes for an AP record.
 * Use with useMutation() in the features layer.
 *
 * @example
 * ```tsx
 * // In features layer
 * const mutation = useMutation({
 *   mutationFn: ({ id, input }: { id: number; input: UpdateAPInput }) =>
 *     updateAccountsPayable(id, input),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: accountsPayableQueries.all() });
 *   },
 * });
 *
 * // Call with input
 * mutation.mutate({
 *   id: 1,
 *   input: {
 *     dueDate: '2025-02-15',
 *     notes: 'Payment due after delivery',
 *   },
 * });
 * ```
 */

import { httpClient } from '@/shared/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result from updating AP metadata.
 */
export interface UpdateAPResult {
  id: number;
  message: string;
}

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request for updating AP metadata.
 */
interface UpdateAPMetadataRequest {
  dueDate?: string | null;
  notes?: string | null;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input type for updating AP metadata.
 * UI-friendly: allows null values to clear fields.
 */
export interface UpdateAPInput {
  /**
   * Due date for the AP (ISO date string).
   * Set to null to clear the due date.
   */
  dueDate?: string | null;

  /**
   * Notes for the AP.
   * Set to null to clear notes.
   */
  notes?: string | null;
}

// =============================================================================
// MAPPING
// =============================================================================

function toUpdateAPRequest(input: UpdateAPInput): UpdateAPMetadataRequest {
  return {
    dueDate: input.dueDate ?? null,
    // Distinguish: undefined = don't change, null/empty/whitespace = clear
    notes: input.notes !== undefined
      ? (input.notes?.trim() || null)  // Explicit clear (null or whitespace → null)
      : undefined,                      // Don't change
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update AP metadata (due date, notes).
 *
 * @param accountsPayableId - The AP ID to update
 * @param input - Metadata to update
 * @returns Result with updated AP ID
 */
export async function updateAccountsPayable(
  accountsPayableId: number,
  input: UpdateAPInput
): Promise<UpdateAPResult> {
  const request = toUpdateAPRequest(input);
  return httpClient.patch<UpdateAPResult>(
    `/accounts-payable/${accountsPayableId}`,
    request
  );
}
