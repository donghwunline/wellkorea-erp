/**
 * Payment method enum and display configuration.
 */

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'CHECK'
  | 'CASH'
  | 'OTHER'
  | 'DISCOUNT';

export interface PaymentMethodConfig {
  label: string;
  labelKo: string;
  icon: string;
}

export const paymentMethodConfig: Record<PaymentMethod, PaymentMethodConfig> = {
  BANK_TRANSFER: {
    label: 'Bank Transfer',
    labelKo: '계좌이체',
    icon: '🏦',
  },
  CREDIT_CARD: {
    label: 'Credit Card',
    labelKo: '신용카드',
    icon: '💳',
  },
  CHECK: {
    label: 'Check',
    labelKo: '수표',
    icon: '📝',
  },
  CASH: {
    label: 'Cash',
    labelKo: '현금',
    icon: '💵',
  },
  OTHER: {
    label: 'Other',
    labelKo: '기타',
    icon: '📋',
  },
  DISCOUNT: {
    label: 'Discount',
    labelKo: '할인',
    icon: '🏷️',
  },
};

/**
 * Get display label for payment method.
 */
export function getPaymentMethodLabel(
  method: PaymentMethod,
  korean = false
): string {
  return korean
    ? paymentMethodConfig[method].labelKo
    : paymentMethodConfig[method].label;
}

/**
 * Get all payment methods as options for select.
 */
export function getPaymentMethodOptions(
  korean = false
): Array<{ value: PaymentMethod; label: string }> {
  return (Object.keys(paymentMethodConfig) as PaymentMethod[]).map((key) => ({
    value: key,
    label: korean
      ? paymentMethodConfig[key].labelKo
      : paymentMethodConfig[key].label,
  }));
}
