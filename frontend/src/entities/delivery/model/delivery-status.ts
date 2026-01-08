/**
 * Delivery status enum and configuration.
 *
 * Status transitions:
 * - PENDING → DELIVERED (normal delivery flow)
 * - DELIVERED → RETURNED (product return)
 * - PENDING → RETURNED (cancelled before delivery)
 */

export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'RETURNED';

export interface DeliveryStatusConfig {
  label: string;
  labelKo: string;
  color: 'yellow' | 'green' | 'red';
  description: string;
}

export const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, DeliveryStatusConfig> = {
  PENDING: {
    label: 'Pending',
    labelKo: '대기',
    color: 'yellow',
    description: 'Delivery is scheduled but not yet completed',
  },
  DELIVERED: {
    label: 'Delivered',
    labelKo: '출고완료',
    color: 'green',
    description: 'Products have been delivered to customer',
  },
  RETURNED: {
    label: 'Returned',
    labelKo: '반품',
    color: 'red',
    description: 'Products were returned (for tracking refunds/corrections)',
  },
};

/**
 * Check if a status transition is allowed.
 */
export function canTransitionTo(
  currentStatus: DeliveryStatus,
  newStatus: DeliveryStatus
): boolean {
  if (newStatus === currentStatus) return false;

  switch (currentStatus) {
    case 'PENDING':
      return newStatus === 'DELIVERED' || newStatus === 'RETURNED';
    case 'DELIVERED':
      return newStatus === 'RETURNED';
    case 'RETURNED':
      return false; // Terminal state
    default:
      return false;
  }
}

/**
 * Get all valid status values.
 */
export const DELIVERY_STATUSES: DeliveryStatus[] = ['PENDING', 'DELIVERED', 'RETURNED'];
