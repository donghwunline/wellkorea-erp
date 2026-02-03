/**
 * AccountsPayable status types and configuration.
 *
 * Note: Status is CALCULATED from payments, not stored in the database.
 * Labels are handled via i18n (purchasing.json accountsPayable.status section).
 */

import type { BadgeVariant } from '@/shared/ui';

export type CalculatedAPStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export interface APStatusConfig {
  readonly color: BadgeVariant;
}

/**
 * Display configuration for each AP status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/purchasing.json under "accountsPayable.status" key.
 */
export const APStatusConfigs: Record<CalculatedAPStatus, APStatusConfig> = {
  PENDING: { color: 'warning' },
  PARTIALLY_PAID: { color: 'copper' },
  PAID: { color: 'success' },
};

export function getAPStatusConfig(status: CalculatedAPStatus): APStatusConfig {
  return APStatusConfigs[status];
}
