/**
 * Items Page - Unified catalog management
 *
 * Displays tabbed interface for:
 * - Products: Items I manufacture and sell
 * - Outsource Items: Service categories I outsource (with vendor offerings)
 * - Materials: Physical materials/items I purchase
 */

import { useTranslation } from 'react-i18next';
import { PageHeader, Tab, TabList, TabPanel, Tabs } from '@/shared/ui';
import { ProductsTab } from './ui/ProductsTab';
import { OutsourceItemsTab } from './ui/OutsourceItemsTab';
import { MaterialsTab } from './ui/MaterialsTab';

/**
 * Items page with tabbed navigation.
 */
export function ItemsPage() {
  const { t } = useTranslation('items');

  return (
    <div className="min-h-screen bg-steel-950 p-6">
      <PageHeader>
        <PageHeader.Title
          title={t('title')}
          description={t('description')}
        />
      </PageHeader>

      <div className="mt-6">
        <Tabs defaultTab="products" hash>
          <TabList>
            <Tab id="products" icon="box">
              {t('tabs.products')}
            </Tab>
            <Tab id="outsource" icon="users">
              {t('tabs.outsourceItems')}
            </Tab>
            <Tab id="materials" icon="shopping-cart">
              {t('tabs.materials')}
            </Tab>
          </TabList>

          <TabPanel id="products">
            <ProductsTab />
          </TabPanel>

          <TabPanel id="outsource">
            <OutsourceItemsTab />
          </TabPanel>

          <TabPanel id="materials">
            <MaterialsTab />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
