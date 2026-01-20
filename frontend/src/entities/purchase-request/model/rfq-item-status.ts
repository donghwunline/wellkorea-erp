/**
 * RFQ Item Status and configuration.
 *
 * Maps to backend RfqItemStatus enum.
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
 */
export interface StatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: BadgeColor;
  readonly description: string;
}

/**
 * Status configuration lookup.
 */
export const RfqItemStatusConfig: Record<RfqItemStatus, StatusConfig> = {
  SENT: {
    label: 'Sent',
    labelKo: '발송됨',
    color: 'info',
    description: 'RFQ sent to vendor, awaiting response',
  },
  REPLIED: {
    label: 'Replied',
    labelKo: '응답함',
    color: 'warning',
    description: 'Vendor has submitted a quote',
  },
  NO_RESPONSE: {
    label: 'No Response',
    labelKo: '무응답',
    color: 'steel',
    description: 'Vendor did not respond',
  },
  SELECTED: {
    label: 'Selected',
    labelKo: '선정됨',
    color: 'success',
    description: 'This vendor was selected for the order',
  },
  REJECTED: {
    label: 'Rejected',
    labelKo: '미선정',
    color: 'danger',
    description: 'This vendor was not selected',
  },
};
