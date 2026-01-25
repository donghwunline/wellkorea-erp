/**
 * AR Aging Summary Widget
 *
 * Displays accounts receivable aging buckets as a visual dashboard.
 * Shows total outstanding, current, 30, 60, and 90+ days buckets.
 *
 * FSD Architecture:
 * - Widget layer: Composite UI combining entity data with visual representation
 * - Uses entities/invoice for AR report data
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Icon } from '@/shared/ui';
import type { ARReport } from '@/entities/invoice';
import { arReportRules } from '@/entities/invoice';

interface ARAgingSummaryProps {
  report: ARReport;
  loading?: boolean;
}

interface BucketCardProps {
  label: string;
  amount: number;
  count: number;
  countLabel: string;
  percentage: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
}

function BucketCard({ label, amount, countLabel, percentage, color }: BucketCardProps) {
  const colorClasses = {
    green: 'border-green-500/30 bg-green-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    gray: 'border-steel-500/30 bg-steel-500/10',
  };

  const textColorClasses = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    gray: 'text-steel-400',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${colorClasses[color]} transition-all hover:scale-[1.02]`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-steel-300">{label}</span>
        <span className={`text-sm ${textColorClasses[color]}`}>{percentage}%</span>
      </div>
      <div className={`text-2xl font-bold ${textColorClasses[color]}`}>
        {arReportRules.formatCurrency(amount)}
      </div>
      <div className="mt-1 text-xs text-steel-500">{countLabel}</div>
    </div>
  );
}

export function ARAgingSummary({ report, loading = false }: ARAgingSummaryProps) {
  const { t } = useTranslation('widgets');

  const buckets = useMemo(() => [
    {
      label: t('arAgingSummary.buckets.current'),
      amount: report.currentAmount,
      count: report.currentCount,
      countLabel: t('arAgingSummary.invoicesCount', { count: report.currentCount }),
      percentage: arReportRules.getBucketPercentage(report.currentAmount, report.totalOutstanding),
      color: 'green' as const,
    },
    {
      label: t('arAgingSummary.buckets.days30'),
      amount: report.days30Amount,
      count: report.days30Count,
      countLabel: t('arAgingSummary.invoicesCount', { count: report.days30Count }),
      percentage: arReportRules.getBucketPercentage(report.days30Amount, report.totalOutstanding),
      color: 'yellow' as const,
    },
    {
      label: t('arAgingSummary.buckets.days60'),
      amount: report.days60Amount,
      count: report.days60Count,
      countLabel: t('arAgingSummary.invoicesCount', { count: report.days60Count }),
      percentage: arReportRules.getBucketPercentage(report.days60Amount, report.totalOutstanding),
      color: 'orange' as const,
    },
    {
      label: t('arAgingSummary.buckets.days90Plus'),
      amount: report.days90PlusAmount,
      count: report.days90PlusCount,
      countLabel: t('arAgingSummary.invoicesCount', { count: report.days90PlusCount }),
      percentage: arReportRules.getBucketPercentage(
        report.days90PlusAmount,
        report.totalOutstanding
      ),
      color: 'red' as const,
    },
  ], [t, report]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-copper-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('arAgingSummary.title')}</h3>
          <p className="mt-1 text-sm text-steel-400">{t('arAgingSummary.description')}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-steel-400">{t('arAgingSummary.totalOutstanding')}</div>
          <div className="mt-1 text-2xl font-bold text-copper-400">
            {arReportRules.formatCurrency(report.totalOutstanding)}
          </div>
          <div className="text-xs text-steel-500">{t('arAgingSummary.totalInvoices', { count: report.totalInvoices })}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-4 overflow-hidden rounded-full bg-steel-800">
        <div className="flex h-full">
          {buckets.map((bucket, index) => (
            <div
              key={bucket.label}
              className={`h-full ${
                bucket.color === 'green'
                  ? 'bg-green-500'
                  : bucket.color === 'yellow'
                    ? 'bg-yellow-500'
                    : bucket.color === 'orange'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              } ${index > 0 ? 'border-l border-steel-700' : ''}`}
              style={{ width: `${bucket.percentage}%` }}
              title={`${bucket.label}: ${arReportRules.formatCurrency(bucket.amount)}`}
            />
          ))}
        </div>
      </div>

      {/* Bucket Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {buckets.map((bucket) => (
          <BucketCard key={bucket.label} {...bucket} />
        ))}
      </div>

      {/* Warning for overdue */}
      {report.days60Amount + report.days90PlusAmount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <Icon name="warning" className="h-5 w-5 text-red-400" />
          <span className="text-sm text-red-300">
            {t('arAgingSummary.overdueWarning', { amount: arReportRules.formatCurrency(report.days60Amount + report.days90PlusAmount) })}
          </span>
        </div>
      )}
    </Card>
  );
}
