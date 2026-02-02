/**
 * Generic Status Badge Component.
 *
 * A reusable status badge that works with any domain's status configuration.
 * Uses i18n for labels and supports optional warning overlay.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <StatusBadge
 *   status="PENDING"
 *   config={QuotationStatusConfig}
 *   i18nKey="quotations:status"
 * />
 *
 * // With warning overlay (for outdated records)
 * <StatusBadge
 *   status="DELIVERED"
 *   config={DeliveryStatusConfig}
 *   i18nKey="deliveries:status"
 *   warning={t('warnings.outdatedQuotation')}
 * />
 * ```
 */

import { useTranslation } from 'react-i18next';
import { Badge, type BadgeVariant } from '../primitives/Badge';
import { Icon } from '../primitives/Icon';

/**
 * Standard status configuration interface.
 * Domain status configs should follow this pattern.
 */
export interface StatusConfig {
  readonly color: BadgeVariant;
}

export interface StatusBadgeProps<TStatus extends string> {
  /** The status value to display */
  status: TStatus;

  /** Status configuration record mapping status to config */
  config: Record<TStatus, StatusConfig>;

  /** i18n translation key prefix (e.g., "quotations:status" -> t("quotations:status.DRAFT")) */
  i18nKey: string;

  /** Badge size */
  size?: 'sm' | 'md';

  /** Show a dot indicator */
  dot?: boolean;

  /** Optional warning message for tooltip (displays warning icon overlay) */
  warning?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Generic status badge component.
 *
 * Works with any domain status configuration that follows the StatusConfig interface.
 * Handles i18n translation automatically and supports optional warning overlay.
 */
export function StatusBadge<TStatus extends string>({
  status,
  config,
  i18nKey,
  size = 'md',
  dot = false,
  warning,
  className,
}: Readonly<StatusBadgeProps<TStatus>>) {
  const { t } = useTranslation();
  const statusConfig = config[status];

  if (!statusConfig) {
    return null;
  }

  const badge = (
    <Badge variant={statusConfig.color} size={size} dot={dot} className={className}>
      {t(`${i18nKey}.${status}`)}
    </Badge>
  );

  // Handle warning overlay (eliminates duplication in Delivery/Invoice)
  if (warning) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {badge}
        <span
          className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400"
          title={warning}
        >
          <Icon name="warning" className="h-3 w-3" />
        </span>
      </span>
    );
  }

  return badge;
}
