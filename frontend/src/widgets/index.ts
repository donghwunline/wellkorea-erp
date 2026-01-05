/**
 * Widgets Layer - Public API.
 *
 * Composite UI blocks that combine multiple features and entities.
 * Widgets are reusable across different pages.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

export {
  QuotationDetailsPanel,
  type QuotationDetailsPanelProps,
} from './quotation-details-panel';

export {
  CompanyManagementPanel,
  type CompanyManagementPanelProps,
} from './company-management';

export {
  ProjectRelatedNavigationGrid,
  type ProjectRelatedNavigationGridProps,
} from './project-related-navigation-grid';

export { UserMenu, type UserMenuProps, type UserMenuItem } from './user-menu';
