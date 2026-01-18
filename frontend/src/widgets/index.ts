/**
 * Widgets Layer - Public API.
 *
 * Composite UI blocks that combine multiple features and entities.
 * Widgets are reusable across different pages.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

export { QuotationPanel, type QuotationPanelProps } from './quotation-panel';

export { CompanyManagementPanel, type CompanyManagementPanelProps } from './company-management';

export {
  ProjectRelatedNavigationGrid,
  type ProjectRelatedNavigationGridProps,
} from './project-related-navigation-grid';

export { UserMenu, type UserMenuProps, type UserMenuItem } from './user-menu';

export { TaskFlowModal, type TaskFlowModalProps } from './task-flow-modal';

export { TaskFlowCanvas, type TaskFlowCanvasProps } from './task-flow-canvas';

export { TaskFlowPanel, type TaskFlowPanelProps } from './task-flow-panel';

export { DeliveryPanel, type DeliveryPanelProps } from './delivery-panel';

export { InvoicePanel, type InvoicePanelProps } from './invoice-panel';

export { OutsourcePanel, type OutsourcePanelProps } from './outsource-panel';

export { PurchasePanel, type PurchasePanelProps } from './purchase-panel';

export {
  PurchaseRequestDetailModal,
  type PurchaseRequestDetailModalProps,
  SendRfqModal,
  type SendRfqModalProps,
} from './purchase-request-panel';

export {
  PurchaseOrderDetailModal,
  type PurchaseOrderDetailModalProps,
} from './purchase-order-panel';
