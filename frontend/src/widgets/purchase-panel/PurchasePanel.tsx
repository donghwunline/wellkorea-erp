/**
 * Purchase Panel Widget (Placeholder)
 *
 * Displays purchasing information for project materials including:
 * - Nuts, screws, tools, and other consumables
 * - Material orders and inventory tracking
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { Card, Icon } from '@/shared/ui';

export interface PurchasePanelProps {
  readonly projectId: number;
}

export function PurchasePanel({ projectId: _projectId }: PurchasePanelProps) {
  return (
    <Card className="p-12 text-center">
      <Icon name="shopping-cart" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
      <h3 className="text-lg font-semibold text-white">구매 for ${_projectId}</h3>
      <p className="mt-2 text-steel-500">프로젝트 자재 구매 관리 기능이 곧 제공될 예정입니다.</p>
      <p className="mt-1 text-sm text-steel-600">(나사, 볼트, 공구 등 소모품 구매)</p>
    </Card>
  );
}
