/**
 * Items Page - Unified catalog management
 *
 * Displays tabbed interface for:
 * - Products: Items I manufacture and sell
 * - Purchased Items: Service categories I buy (with vendor offerings)
 */

import { PageHeader, Tab, TabList, TabPanel, Tabs } from '@/components/ui';
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
          title="아이템"
          description="Manage your product catalog and purchased item categories"
        />
      </PageHeader>

      <div className="mt-6">
        <Tabs defaultTab="products" hash>
          <TabList>
            <Tab id="products" icon="box">
              판매 품목
            </Tab>
            <Tab id="purchased" icon="shopping-cart">
              구매 품목
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
