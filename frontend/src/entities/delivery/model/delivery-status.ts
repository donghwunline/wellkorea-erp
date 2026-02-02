/**
 * Delivery status enum and configuration.
 *
 * Status transitions:
 * - PENDING → DELIVERED (normal delivery flow)
 * - DELIVERED → RETURNED (product return)
 * - PENDING → RETURNED (cancelled before delivery)
 *
 * Labels are handled via i18n (deliveries.json status section).
 */

import type { BadgeVariant } from '@/shared/ui';

export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'RETURNED';

export interface DeliveryStatusConfig {
  color: BadgeVariant;
}

/**
 * Display configuration for each delivery status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/deliveries.json under "status" key.
 */
export const DeliveryStatusConfig: Record<DeliveryStatus, DeliveryStatusConfig> = {
  PENDING: { color: 'warning' },
  DELIVERED: { color: 'success' },
  RETURNED: { color: 'danger' },
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
