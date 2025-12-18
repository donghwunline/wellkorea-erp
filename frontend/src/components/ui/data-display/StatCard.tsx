/**
 * StatCard component for displaying dashboard statistics
 *
 * A specialized Card variant optimized for stat displays with icon, label, and value.
 * Provides consistent layout for dashboard metrics.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/shared/utils';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

const TREND_STYLES = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-steel-400',
} as const;

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-steel-800/50 bg-steel-900/60 p-4 backdrop-blur-sm',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-steel-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            {trend && (
              <p className={cn('mt-1 text-xs', TREND_STYLES[trend.direction])}>
                {trend.value}
              </p>
            )}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-steel-800/50 text-copper-500">
            {icon}
          </div>
        </div>
      </div>
    );
  },
);

StatCard.displayName = 'StatCard';

export default StatCard;
