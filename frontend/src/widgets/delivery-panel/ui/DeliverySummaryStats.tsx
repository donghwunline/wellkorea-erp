/**
 * Delivery Summary Stats Component
 *
 * Displays summary statistics for deliveries in a 4-column grid.
 */

import { useMemo } from 'react';
import { Card } from '@/shared/ui';
import type { Delivery } from '@/entities/delivery';
import { deliveryRules } from '@/entities/delivery';

export interface DeliverySummaryStatsProps {
  readonly deliveries: readonly Delivery[];
}

export function DeliverySummaryStats({ deliveries }: DeliverySummaryStatsProps) {
  const stats = useMemo(() => deliveryRules.calculateStats(deliveries), [deliveries]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="text-sm text-steel-400">Total Deliveries</div>
        <div className="mt-1 text-2xl font-bold text-white">{stats.totalDeliveries}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Items Delivered</div>
        <div className="mt-1 text-2xl font-bold text-copper-400">
          {stats.totalItemsDelivered}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Pending</div>
        <div className="mt-1 text-2xl font-bold text-yellow-500">{stats.pendingCount}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Delivered</div>
        <div className="mt-1 text-2xl font-bold text-green-500">{stats.deliveredCount}</div>
      </Card>
    </div>
  );
}
