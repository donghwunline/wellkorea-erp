/**
 * RFQ Item Status and configuration.
 *
 * Maps to backend RfqItemStatus enum.
 * Labels are handled via i18n (purchasing.json rfq.itemStatus section).
 */

/**
 * RFQ item lifecycle statuses.
 * Const object pattern provides both type safety and runtime values.
 */
export const RfqItemStatus = {
  SENT: 'SENT',
  REPLIED: 'REPLIED',
  NO_RESPONSE: 'NO_RESPONSE',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
} as const;

export type RfqItemStatus = (typeof RfqItemStatus)[keyof typeof RfqItemStatus];

/**
 * Badge color variants from the design system.
 */
export type BadgeColor = 'steel' | 'copper' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

/**
 * Status display configuration.
 * Labels are in locales/{lang}/purchasing.json under "rfq.itemStatus" key.
 */
export interface StatusConfig {
  readonly color: BadgeColor;
}

/**
 * Status configuration lookup.
 */
export const RfqItemStatusConfig: Record<RfqItemStatus, StatusConfig> = {
  SENT: { color: 'info' },
  REPLIED: { color: 'warning' },
  NO_RESPONSE: { color: 'steel' },
  SELECTED: { color: 'success' },
  REJECTED: { color: 'danger' },
};
