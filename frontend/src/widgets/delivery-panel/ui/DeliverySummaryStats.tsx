/**
 * Delivery Summary Stats Component
 *
 * Displays summary statistics for deliveries in a 4-column grid.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Delivery } from '@/entities/delivery';
import { deliveryRules } from '@/entities/delivery';

export interface DeliverySummaryStatsProps {
  readonly deliveries: readonly Delivery[];
}

export function DeliverySummaryStats({ deliveries }: DeliverySummaryStatsProps) {
  const { t } = useTranslation('widgets');
  const stats = useMemo(() => deliveryRules.calculateStats(deliveries), [deliveries]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('deliverySummaryStats.totalDeliveries')}</div>
        <div className="mt-1 text-2xl font-bold text-white">{stats.totalDeliveries}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('deliverySummaryStats.itemsDelivered')}</div>
        <div className="mt-1 text-2xl font-bold text-copper-400">
          {stats.totalItemsDelivered}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('deliverySummaryStats.pending')}</div>
        <div className="mt-1 text-2xl font-bold text-yellow-500">{stats.pendingCount}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('deliverySummaryStats.delivered')}</div>
        <div className="mt-1 text-2xl font-bold text-green-500">{stats.deliveredCount}</div>
      </Card>
    </div>
  );
}
