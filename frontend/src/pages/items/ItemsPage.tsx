/**
 * Items Page - Unified catalog management
 *
 * Displays tabbed interface for:
 * - Products: Items I manufacture and sell
 * - Purchased Items: Service categories I buy (with vendor offerings)
 */

import { PageHeader, Tabs, TabList, Tab, TabPanel } from '@/components/ui';
import { ProductsTab } from './ProductsTab';
import { PurchasedItemsTab } from './PurchasedItemsTab';

/**
 * Items page with tabbed navigation.
 */
export function ItemsPage() {
  return (
    <div className="min-h-screen bg-steel-950 p-6">
      <PageHeader>
        <PageHeader.Title
          title="Items"
          description="Manage your product catalog and purchased item categories"
        />
      </PageHeader>

      <div className="mt-6">
        <Tabs defaultTab="products" hash>
          <TabList>
            <Tab id="products" icon="box">
              Products
            </Tab>
            <Tab id="purchased" icon="shopping-cart">
              Purchased Items
            </Tab>
          </TabList>

          <TabPanel id="products">
            <ProductsTab />
          </TabPanel>

          <TabPanel id="purchased">
            <PurchasedItemsTab />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
