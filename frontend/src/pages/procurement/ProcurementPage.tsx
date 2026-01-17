/**
 * Procurement Page - Unified procurement management.
 *
 * Displays tabbed interface for:
 * - Purchase Requests: All procurement requests (service and material)
 * - RFQ: Requests in RFQ stage (sent to vendors, awaiting quotes)
 * - Purchase Orders: Confirmed orders to vendors
 */

import { PageHeader, Tab, TabList, TabPanel, Tabs } from '@/shared/ui';
import { PurchaseRequestsTab } from './ui/PurchaseRequestsTab';
import { RfqTab } from './ui/RfqTab';
import { PurchaseOrdersTab } from './ui/PurchaseOrdersTab';

/**
 * Procurement page with tabbed navigation.
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
        <Tabs defaultTab="requests" hash>
          <TabList>
            <Tab id="requests" icon="document">
              구매 요청
            </Tab>
            <Tab id="rfq" icon="paper-airplane">
              RFQ
            </Tab>
            <Tab id="orders" icon="shopping-cart">
              발주서
            </Tab>
          </TabList>

          <TabPanel id="requests">
            <PurchaseRequestsTab />
          </TabPanel>

          <TabPanel id="rfq">
            <RfqTab />
          </TabPanel>

          <TabPanel id="orders">
            <PurchaseOrdersTab />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
