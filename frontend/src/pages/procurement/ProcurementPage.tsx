/**
 * Procurement Page - Placeholder
 *
 * Future features:
 * - Purchase Requests
 * - RFQ (Request for Quotation)
 * - Purchase Orders
 */

import { Card, Icon, PageHeader } from '@/shared/ui';

/**
 * Procurement page placeholder.
 */
export function ProcurementPage() {
  return (
    <div className="min-h-screen bg-steel-950 p-6">
      <PageHeader>
        <PageHeader.Title
          title="조달"
          description="Manage purchase requests, RFQs, and purchase orders"
        />
      </PageHeader>

      <div className="mt-6">
        <Card className="p-12 text-center">
          <Icon name="shopping-cart" className="mx-auto h-16 w-16 text-steel-600" />
          <h2 className="mt-4 text-xl font-semibold text-white">Coming Soon</h2>
          <p className="mt-2 text-steel-400">
            The procurement module is under development. It will include:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-steel-300">
            <li>Purchase Requests - Request materials and services</li>
            <li>RFQ Management - Request quotes from vendors</li>
            <li>Purchase Orders - Create and manage POs</li>
            <li>Vendor Comparison - Compare prices and lead times</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
