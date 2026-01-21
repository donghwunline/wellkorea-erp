/**
 * AccountsPayable status types and configuration.
 *
 * Note: Status is CALCULATED from payments, not stored in the database.
 */

export type CalculatedAPStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export interface APStatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: 'warning' | 'info' | 'success';
}

export const APStatusConfigs: Record<CalculatedAPStatus, APStatusConfig> = {
  PENDING: {
    label: 'Pending',
    labelKo: '미지급',
    color: 'warning',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    labelKo: '일부지급',
    color: 'info',
  },
  PAID: {
    label: 'Paid',
    labelKo: '완납',
    color: 'success',
  },
};

export function getAPStatusConfig(status: CalculatedAPStatus): APStatusConfig {
  return APStatusConfigs[status];
}
