/**
 * Vitest test environment setup
 *
 * This file is automatically loaded before all tests.
 * It configures the test environment, mocks, and global utilities.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

/**
 * Mock translations for testing.
 * Maps i18n keys to English strings that tests expect.
 */
const mockTranslations: Record<string, string> = {
  // Auth translations
  'login.title': 'Login',
  'login.subtitle': 'Integrated Work System',
  'login.username': 'Username',
  'login.usernamePlaceholder': 'Enter your username',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.rememberMe': 'Remember me',
  'login.submit': 'Sign in',
  'login.submitting': 'Signing in...',

  // Navigation translations
  'navigation:sections.operations': 'Operations',
  'navigation:sections.masterData': 'Master Data',
  'navigation:sections.reports': 'Reports',
  'navigation:sections.approval': 'Approval',
  'navigation:sections.administration': 'Administration',
  'navigation:brand.name': 'WellKorea',
  'navigation:items.dashboard': 'Dashboard',
  'navigation:items.projects': 'Projects',
  'navigation:items.quotations': 'Quotations',
  'navigation:items.deliveries': 'Deliveries',
  'navigation:items.invoices': 'Invoices',
  'navigation:items.items': 'Items',
  'navigation:items.companies': 'CRM',
  'navigation:items.procurement': 'Procurement',
  'navigation:items.arApReports': 'AR/AP Reports',
  'navigation:items.pendingApprovals': 'Pending Approvals',
  'navigation:items.approvalSettings': 'Approval Settings',
  'navigation:items.userManagement': 'User Management',
  'navigation:items.auditLogs': 'Audit Logs',

  // Common translations
  'common:accessDenied.title': 'Access Denied',
  'common:accessDenied.description': "You don't have permission to access this page",
  'common:accessDenied.goHome': 'Go to Home',
  'common:notFound.title': 'Page Not Found',
  'common:notFound.description': 'The page you requested does not exist',
  'common:notFound.goHome': 'Go to Home',
  'common:buttons.save': 'Save',
  'common:buttons.cancel': 'Cancel',
  'common:buttons.confirm': 'Confirm',
  'common:buttons.delete': 'Delete',
  'common:buttons.edit': 'Edit',
  'common:buttons.create': 'Create',
  'common:buttons.submit': 'Submit',
  'common:buttons.close': 'Close',
  'common:buttons.back': 'Back',
  'common:buttons.retry': 'Retry',
  'common:buttons.search': 'Search',
  'common:buttons.add': 'Add',
  'common:buttons.remove': 'Remove',

  // Common status translations
  'common:status.loading': 'Loading...',
  'common:status.saving': 'Saving...',
  'common:status.success': 'Success',
  'common:status.error': 'Error',
  'common:status.pending': 'Pending',
  'common:status.active': 'Active',
  'common:status.inactive': 'Inactive',
  'common:status.completed': 'Completed',
  'common:status.processing': 'Processing...',
  'common:status.deleting': 'Deleting...',

  // Common table translations
  'common:table.noData': 'No data found',
  'common:table.actions': 'Actions',
  'common:table.loading': 'Loading data...',
  'common:table.error': 'Error loading data',
  'common:table.empty': 'No data to display',
  'common:table.rowsPerPage': 'Rows per page',
  'common:table.total': '{{count}} total',

  // Common empty state translations
  'common:empty.title': 'No Data',
  'common:empty.description': 'No content to display',

  // Validation translations
  'validation:requiredField': '{{field}} is required',
  'validation:required': 'This field is required',

  // Error translations - these should match test expectations
  'errors:codes.AUTH_001': 'Invalid username or password',
  'errors:codes.AUTH_003': 'Session expired',

  // Project translations (Korean title, tests expect Korean)
  'projects:title': '프로젝트',
  'projects:description': 'Manage customer projects and job codes',
  'projects:list.new': 'New Project',
  'projects:list.empty': 'No projects registered',
  'projects:list.emptySearch': 'No projects found matching your search',
  'projects:list.loading': 'Loading projects...',
  'projects:list.loadError': 'Failed to load projects',
  'projects:list.searchPlaceholder': 'Search by job code or project name...',
  'projects:table.headers.jobCode': 'Job Code',
  'projects:table.headers.projectName': 'Project Name',
  'projects:table.headers.dueDate': 'Due Date',
  'projects:table.headers.status': 'Status',
  'projects:table.headers.actions': 'Actions',
  'projects:fields.contact': 'Contact',
  'projects:actions.view': 'View Details',
  'projects:status.DRAFT': 'Draft',
  'projects:status.ACTIVE': 'Active',
  'projects:status.COMPLETED': 'Completed',
  'projects:status.ARCHIVED': 'Archived',

  // Quotation translations
  'quotations:title': 'Quotations',
  'quotations:description': 'View and manage all quotations',
  'quotations:list.new': 'New Quotation',
  'quotations:list.empty': 'No quotations registered',
  'quotations:list.emptyFiltered': 'No quotations found with selected status',
  'quotations:list.loading': 'Loading quotations...',
  'quotations:list.searchPlaceholder': 'Search by job code, project name...',
  'quotations:list.allStatuses': 'All Statuses',
  'quotations:status.DRAFT': 'Draft',
  'quotations:status.PENDING_APPROVAL': 'Pending Approval',
  'quotations:status.APPROVED': 'Approved',
  'quotations:status.SENT': 'Sent',
  'quotations:status.ACCEPTED': 'Accepted',
  'quotations:status.REJECTED': 'Rejected',
  'quotations:actions.view': 'View Details',
  'quotations:actions.edit': 'Edit',
  'quotations:actions.submit': 'Submit for Approval',
  'quotations:actions.downloadPdf': 'Download PDF',
  'quotations:actions.sendEmail': 'Send Email',
  'quotations:actions.createNewVersion': 'Create New Version',
  'quotations:approval.submitTitle': 'Submit for Approval',
  'quotations:approval.submitMessage': 'Are you sure you want to submit for approval?',
  'quotations:approval.submitSuccess': 'Submitted for approval',
  'quotations:version.createTitle': 'Create New Version',
  'quotations:version.createMessage': 'Create a new version?',
  'quotations:version.createSuccess': 'New version created',
  'quotations:version.create': 'Create Version',
  'quotations:email.sendSuccess': 'Email sent successfully',
  'quotations:email.sendError': 'Failed to send email',

  // Company translations
  'companies:title': 'CRM',
  'companies:description': 'Manage customers, vendors, and outsource partners',
  'companies:list.new': 'New Company',
  'companies:list.empty': 'No companies registered',
  'companies:list.loading': 'Loading companies...',
  'companies:list.loadError': 'Failed to load companies',
  'companies:list.searchPlaceholder': 'Search by company name, email, or registration number...',
  'companies:filters.all': 'All',
  'companies:roleType.CUSTOMER': 'Customer',
  'companies:roleType.VENDOR': 'Vendor',
  'companies:roleType.OUTSOURCE': 'Outsource',
  'companies:actions.view': 'View Details',
  'companies:actions.edit': 'Edit',

  // Common modal/email translations
  'common:email.title': 'Send Email',
  'common:email.to': 'To',
  'common:email.cc': 'CC Recipients (optional)',
  'common:email.addCc': 'Add CC recipients',
  'common:email.send': 'Send Email',
  'common:email.sending': 'Sending...',
  'common:email.pdfAttachment': 'A PDF attachment will be included with the email.',
  'common:email.required': 'Email address is required',
  'common:email.invalidFormat': 'Invalid email format',
  'common:email.placeholder': 'Enter email and press Enter',

  // Common fields
  'common:fields.createdAt': 'Created At',
  'common:fields.updatedAt': 'Updated At',
  'common:fields.deliveredBy': 'Delivered By',

  // Delivery translations
  'deliveries:title': 'Deliveries',
  'deliveries:description': 'View and manage delivery records',
  'deliveries:list.allStatuses': 'All Statuses',
  'deliveries:list.loading': 'Loading deliveries...',
  'deliveries:list.loadError': 'Failed to load deliveries',
  'deliveries:list.empty': 'No deliveries registered',
  'deliveries:list.emptyFiltered': 'No deliveries found with status "{{status}}"',
  'deliveries:fields.status': 'Status',
  'deliveries:fields.deliveryDate': 'Delivery Date',
  'deliveries:fields.project': 'Project',
  'deliveries:fields.notes': 'Notes',
  'deliveries:status.DRAFT': 'Draft',
  'deliveries:status.PENDING': 'Pending',
  'deliveries:status.PREPARING': 'Preparing',
  'deliveries:status.SHIPPED': 'Shipped',
  'deliveries:status.IN_TRANSIT': 'In Transit',
  'deliveries:status.DELIVERED': 'Delivered',
  'deliveries:status.CANCELLED': 'Cancelled',
  'deliveries:actions.view': 'View Details',
  'deliveries:actions.downloadStatement': 'Download Statement',
  'deliveries:actions.backToList': 'Back to List',
  'deliveries:actions.backToProject': 'Back to Project',
  'deliveries:view.loading': 'Loading delivery details...',
  'deliveries:view.loadError': 'Failed to load delivery',
  'deliveries:view.notFound': 'Delivery not found',
  'deliveries:view.deliveredItems': 'Delivered Items',
  'deliveries:view.itemCount': '{{count}} items, {{total}} total units',
  'deliveries:view.total': 'Total',
  'deliveries:lineItems.product': 'Product',
  'deliveries:lineItems.shippedQuantity': 'Shipped Qty',
  'deliveries:lineItems.title': 'Delivery Items',
  'deliveries:lineItems.enterQuantityHint': 'Enter the quantity delivered for each item.',
  'deliveries:lineItems.quoted': 'Quoted',
  'deliveries:lineItems.delivered': 'Delivered',
  'deliveries:lineItems.remaining': 'Remaining',
  'deliveries:lineItems.toDeliver': 'Qty to Deliver',
  'deliveries:lineItems.totalToDeliver': 'Total Quantity to Deliver:',
  'deliveries:create.title': 'Create New Delivery',
  'deliveries:create.description': 'Record a new delivery for this project',
  'deliveries:create.loading': 'Loading quotation data...',
  'deliveries:create.error': 'Failed to create delivery',
  'deliveries:create.noQuotation': 'No Accepted Quotation',
  'deliveries:create.noQuotationDesc': 'This project does not have an accepted quotation.',
  'deliveries:create.allDelivered': 'All Items Delivered',
  'deliveries:create.allDeliveredDesc': 'All quotation items have been fully delivered.',
  'deliveries:create.deliveryInfo': 'Delivery Information',
  'deliveries:create.createButton': 'Create Delivery',
  'deliveries:create.saving': 'Saving...',
  'deliveries:validation.noQuotationFound': 'No accepted quotation found',
  'deliveries:validation.enterAtLeastOne': 'Please enter quantity for at least one item',
  'deliveries:validation.exceedsRemaining': 'Quantity for {{product}} exceeds remaining ({{remaining}})',

  // Invoice translations
  'invoices:title': 'Tax Invoices',
  'invoices:description': 'View and manage tax invoices',
  'invoices:list.allStatuses': 'All Statuses',
  'invoices:list.new': 'New Invoice',
  'invoices:list.empty': 'No invoices registered',
  'invoices:list.emptyFiltered': 'No invoices found with status "{{status}}"',
  'invoices:list.loadError': 'Failed to load invoices',
  'invoices:fields.status': 'Status',
  'invoices:fields.project': 'Project',
  'invoices:fields.issueDate': 'Issue Date',
  'invoices:fields.dueDate': 'Due Date',
  'invoices:fields.notes': 'Notes',
  'invoices:fields.subtotal': 'Subtotal',
  'invoices:fields.tax': 'Tax',
  'invoices:fields.total': 'Total',
  'invoices:fields.balanceDue': 'Balance Due',
  'invoices:status.DRAFT': 'Draft',
  'invoices:status.PENDING_APPROVAL': 'Pending Approval',
  'invoices:status.APPROVED': 'Approved',
  'invoices:status.SENT': 'Sent',
  'invoices:status.PARTIALLY_PAID': 'Partially Paid',
  'invoices:status.PAID': 'Paid',
  'invoices:status.OVERDUE': 'Overdue',
  'invoices:status.CANCELLED': 'Cancelled',
  'invoices:status.VOID': 'Void',
  'invoices:actions.backToList': 'Back to List',
  'invoices:actions.issue': 'Issue Invoice',
  'invoices:actions.issuing': 'Issuing...',
  'invoices:actions.recordPayment': 'Record Payment',
  'invoices:actions.cancel': 'Cancel Invoice',
  'invoices:actions.cancelling': 'Cancelling...',
  'invoices:actions.keepInvoice': 'Keep Invoice',
  'invoices:view.loading': 'Loading invoice details...',
  'invoices:view.loadError': 'Failed to load invoice',
  'invoices:view.notFound': 'Invoice not found',
  'invoices:view.amounts': 'Invoice Amounts',
  'invoices:view.lineItems': 'Line Items',
  'invoices:view.items': '{{count}} items',
  'invoices:view.paymentHistory': 'Payment History',
  'invoices:view.payments': '{{count}} payments',
  'invoices:view.noPayments': 'No payments have been recorded for this invoice',
  'invoices:view.paymentProgress': 'Payment Progress',
  'invoices:view.paid': 'Paid',
  'invoices:view.remaining': 'Remaining',
  'invoices:view.aging': 'Aging',
  'invoices:view.daysOverdue': '{{days}} days overdue',
  'invoices:lineItems.product': 'Product',
  'invoices:lineItems.quantity': 'Quantity',
  'invoices:lineItems.unitPrice': 'Unit Price',
  'invoices:lineItems.amount': 'Amount',
  'invoices:payment.record.title': 'Record Payment',
  'invoices:payment.record.date': 'Payment Date',
  'invoices:payment.record.amount': 'Payment Amount',
  'invoices:payment.record.method': 'Payment Method',
  'invoices:payment.record.reference': 'Reference Number',
  'invoices:payment.record.referenceHint': 'e.g., Check number, transaction ID',
  'invoices:payment.record.notes': 'Notes',
  'invoices:payment.record.notesHint': 'Optional notes about this payment',
  'invoices:payment.record.remainingBalance': 'Remaining balance: {{amount}}',
  'invoices:payment.record.recording': 'Recording...',
  'invoices:payment.record.submit': 'Record Payment',
  'invoices:cancel.title': 'Cancel Invoice',
  'invoices:cancel.confirm': 'Are you sure you want to cancel invoice {{number}}?',
  'invoices:cancel.warning': 'This action cannot be undone.',
  'invoices:validation.invalidAmount': 'Please enter a valid payment amount',
  'invoices:validation.paymentDateRequired': 'Please enter a payment date',
  'invoices:validation.exceedsBalance': 'Payment amount ({{amount}}) exceeds remaining balance ({{balance}})',

  // Purchasing translations
  'purchasing:title': 'Procurement',
  'purchasing:description': 'Manage purchase requests, RFQs, and purchase orders',
  'purchasing:tabs.purchaseRequests': 'Purchase Requests',
  'purchasing:tabs.rfq': 'RFQ',
  'purchasing:tabs.purchaseOrders': 'Purchase Orders',
  'purchasing:purchaseRequest.title': 'Purchase Requests',
  'purchasing:purchaseRequest.list.empty': 'No purchase requests found.',
  'purchasing:purchaseRequest.list.allStatuses': 'All Statuses',
  'purchasing:purchaseRequest.list.allTypes': 'All Types',
  'purchasing:purchaseRequest.list.loadError': 'Failed to load purchase requests',
  'purchasing:purchaseRequest.status.DRAFT': 'Draft',
  'purchasing:purchaseRequest.status.RFQ_SENT': 'RFQ Sent',
  'purchasing:purchaseRequest.status.VENDOR_SELECTED': 'Vendor Selected',
  'purchasing:purchaseRequest.status.ORDERED': 'Ordered',
  'purchasing:purchaseRequest.status.CLOSED': 'Closed',
  'purchasing:purchaseRequest.status.CANCELED': 'Canceled',
  'purchasing:rfq.title': 'RFQ',
  'purchasing:rfq.list.empty': 'No RFQ requests found.',
  'purchasing:rfq.list.loadError': 'Failed to load RFQ list',
  'purchasing:rfq.summary.rfqSent': 'RFQ Sent',
  'purchasing:rfq.summary.vendorSelected': 'Vendor Selected',
  'purchasing:rfq.summary.ordered': 'Ordered',
  'purchasing:rfq.summary.count': '{{count}} items',
  'purchasing:rfq.sections.rfqSent': 'RFQ Sent',
  'purchasing:rfq.sections.vendorSelectedPending': 'Vendor Selected - Awaiting PO',
  'purchasing:rfq.sections.orderedPending': 'Ordered - Awaiting Delivery',
  'purchasing:purchaseOrder.title': 'Purchase Orders',
  'purchasing:purchaseOrder.list.empty': 'No purchase orders found.',
  'purchasing:purchaseOrder.list.allStatuses': 'All Statuses',
  'purchasing:purchaseOrder.list.loadError': 'Failed to load purchase orders',
  'purchasing:purchaseOrder.status.DRAFT': 'Draft',
  'purchasing:purchaseOrder.status.SENT': 'Sent',
  'purchasing:purchaseOrder.status.CONFIRMED': 'Confirmed',
  'purchasing:purchaseOrder.status.RECEIVED': 'Received',
  'purchasing:purchaseOrder.status.CANCELED': 'Canceled',
  'purchasing:type.SERVICE': 'Service',
  'purchasing:type.MATERIAL': 'Material',
  'purchasing:common.retry': 'Retry',
  'purchasing:table.headers.requestNumber': 'Request No.',
  'purchasing:table.headers.poNumber': 'PO Number',
  'purchasing:table.headers.type': 'Type',
  'purchasing:table.headers.project': 'Project',
  'purchasing:table.headers.vendor': 'Vendor',
  'purchasing:table.headers.item': 'Item',
  'purchasing:table.headers.description': 'Description',
  'purchasing:table.headers.quantity': 'Quantity',
  'purchasing:table.headers.requiredDate': 'Required Date',
  'purchasing:table.headers.orderDate': 'Order Date',
  'purchasing:table.headers.expectedDeliveryDate': 'Expected Delivery',
  'purchasing:table.headers.amount': 'Amount',
  'purchasing:table.headers.status': 'Status',
  'purchasing:table.headers.requester': 'Requester',
  'purchasing:table.headers.manager': 'Manager',

  // Items translations
  'items:title': 'Items',
  'items:description': 'Manage your product catalog, outsourced services, and purchased materials',
  'items:tabs.products': 'Products',
  'items:tabs.materials': 'Materials',
  'items:tabs.outsourceItems': 'Outsource Items',
  'items:products.title': 'Products',
  'items:products.list.empty': 'No products found.',
  'items:products.list.emptyWithAction': 'No products found. Click "Add Product" to create your first product.',
  'items:products.list.allTypes': 'All Types',
  'items:products.list.searchPlaceholder': 'Search by name or SKU...',
  'items:products.list.loadError': 'Failed to load products',
  'items:materials.title': 'Materials',
  'items:materials.list.empty': 'No materials found.',
  'items:materials.list.emptyWithAction': 'No materials found. Click "Add Material" to create your first material.',
  'items:materials.list.allCategories': 'All Categories',
  'items:materials.list.searchPlaceholder': 'Search materials by name or SKU...',
  'items:materials.list.loadError': 'Failed to load materials',
  'items:materials.view.modalTitle': 'Material: {{name}}',
  'items:materials.view.noDescription': 'No description',
  'items:materials.view.preferredVendorNone': 'None',
  'items:materials.offerings.modalTitle': 'Vendors for "{{name}}"',
  'items:materials.offerings.empty': 'No vendors currently supply this material.',
  'items:materials.offerings.addOffering': 'Add Vendor Offering',
  'items:materials.offerings.setAsPreferred': 'Set as Preferred',
  'items:materials.fields.description': 'Description',
  'items:outsourceItems.title': 'Outsource Items',
  'items:outsourceItems.list.empty': 'No service categories found.',
  'items:outsourceItems.list.emptyWithAction': 'No service categories found. Click "Add Category" to create your first service category.',
  'items:outsourceItems.list.searchPlaceholder': 'Search service categories...',
  'items:outsourceItems.list.includeInactive': 'Include Inactive',
  'items:outsourceItems.list.loadError': 'Failed to load service categories',
  'items:outsourceItems.vendorCount': '{{count}} vendor(s)',
  'items:outsourceItems.offerings.modalTitle': 'Vendors for "{{name}}"',
  'items:outsourceItems.offerings.empty': 'No vendors currently offer this service.',
  'items:outsourceItems.offerings.addOffering': 'Add Vendor Offering',
  'items:status.ACTIVE': 'Active',
  'items:status.INACTIVE': 'Inactive',
  'items:status.DISCONTINUED': 'Discontinued',
  'items:table.headers.sku': 'SKU',
  'items:table.headers.code': 'Code',
  'items:table.headers.name': 'Name',
  'items:table.headers.category': 'Category',
  'items:table.headers.unit': 'Unit',
  'items:table.headers.unitPrice': 'Unit Price',
  'items:table.headers.standardPrice': 'Standard Price',
  'items:table.headers.preferredVendor': 'Preferred Vendor',
  'items:table.headers.status': 'Status',
  'items:table.headers.vendor': 'Vendor',
  'items:table.headers.leadTime': 'Lead Time',
  'items:table.headers.effectivePeriod': 'Effective Period',
  'items:table.headers.preferred': 'Preferred',
  'items:table.headers.actions': 'Actions',
  'items:actions.view': 'View Details',
  'items:actions.viewDetails': 'Details',
  'items:actions.vendors': 'Vendors',
  'items:actions.edit': 'Edit',
  'items:actions.delete': 'Delete',
  'items:actions.deactivate': 'Deactivate',
  'items:actions.activate': 'Activate',
  'items:actions.activating': 'Activating...',
  'items:common.retry': 'Retry',
  'items:common.addProduct': 'Add Product',
  'items:common.addMaterial': 'Add Material',
  'items:common.addCategory': 'Add Category',
  'items:common.days': '{{count}} days',
  'items:common.noVendors': 'None',

  // Approval translations
  'approval:title': 'Approval',
  'approval:description': 'Review and process pending approval requests',
  'approval:list.title': 'Pending Approvals',
  'approval:list.empty': 'No pending approval requests.',
  'approval:list.emptyFiltered': 'No approval requests found with selected status.',
  'approval:list.loading': 'Loading approval requests...',
  'approval:list.allStatuses': 'All Statuses',
  'approval:status.PENDING': 'Pending',
  'approval:status.APPROVED': 'Approved',
  'approval:status.REJECTED': 'Rejected',
  'approval:status.CANCELLED': 'Cancelled',
  'approval:approve.success': 'Approval submitted successfully',
  'approval:reject.success': 'Rejection submitted successfully',
  'approval:table.headers.status': 'Status',
  'approval:table.headers.actions': 'Actions',
  'approval:chain.title': 'Approval Settings',
  'approval:chain.description': 'Configure approval workflows for different entity types',
  'approval:chain.list.empty': 'No approval chain templates configured.',
  'approval:chain.list.loading': 'Loading approval chain templates...',
  'approval:chain.edit.success': 'Approval chain updated successfully',
  'approval:chain.edit.modalTitle': 'Edit Approval Chain: {{name}}',
  'approval:chain.table.entityType': 'Entity Type',
  'approval:chain.table.name': 'Name',
  'approval:chain.table.approvalLevels': 'Approval Levels',
  'approval:chain.table.approvers': 'Approvers',
  'approval:chain.steps.add': 'Add Level',
  'approval:chain.steps.noLevels': 'No levels configured. Add at least one approval level.',
  'approval:chain.steps.selectApprover': 'Select approver...',
  'approval:chain.steps.processOrder': 'Approvals will be processed in order from Level 1 to the highest level.',
  'approval:common.cancel': 'Cancel',
  'approval:common.save': 'Save Changes',
  'approval:common.saving': 'Saving...',

  // Admin translations (Korean titles, tests expect Korean)
  'admin:users.title': '사용자 관리',
  'admin:users.description': 'Manage system users and their roles',
  'admin:users.list.create': 'Add User',
  'admin:users.list.empty': 'No users found.',
  'admin:users.list.emptySearch': 'No users found matching your search.',
  'admin:users.list.searchPlaceholder': 'Search by username, email, or name...',
  'admin:users.list.loadError': 'Failed to load users',
  'admin:users.search': 'Search',
  'admin:audit.title': '이력 관리',
  'admin:audit.description': 'System activity and security events',
  'admin:audit.list.empty': 'No audit logs found.',
  'admin:audit.list.loadError': 'Failed to load audit logs',
  'admin:audit.filters.entityType': 'Entity Type',
  'admin:audit.filters.action': 'Action',
  'admin:audit.filters.allTypes': 'All Types',
  'admin:audit.filters.allActions': 'All Actions',
  'admin:audit.filters.clearFilters': 'Clear Filters',
  'admin:audit.details.title': 'Audit Log Details',
  'admin:audit.details.entry': 'Entry #{{id}}',
  'admin:audit.details.metadata': 'Metadata',
  'admin:audit.fields.action': 'Action',
  'admin:audit.fields.entity': 'Entity Type',
  'admin:audit.fields.entityId': 'Entity ID',
  'admin:audit.fields.user': 'User',
  'admin:audit.fields.ipAddress': 'IP Address',
  'admin:audit.fields.changes': 'Changes',
  'admin:audit.actions.CREATE': 'CREATE',
  'admin:audit.actions.UPDATE': 'UPDATE',
  'admin:audit.actions.DELETE': 'DELETE',
  'admin:audit.actions.LOGIN': 'LOGIN',
  'admin:audit.actions.LOGOUT': 'LOGOUT',
  'admin:common.retry': 'Retry',
};

/**
 * Translation function that mimics i18next t() behavior.
 * Returns the mapped translation or the key itself.
 */
function mockT(key: string, options?: Record<string, unknown>): string {
  let result = mockTranslations[key] ?? key;

  // Handle interpolation (replace {{key}} with value)
  if (options) {
    for (const [optKey, optValue] of Object.entries(options)) {
      result = result.replace(new RegExp(`{{${optKey}}}`, 'g'), String(optValue));
    }
  }

  return result;
}

// Mock i18next for tests
vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // If key already has namespace prefix, use as-is
      if (key.includes(':')) {
        return mockT(key, options);
      }
      // Otherwise, prepend namespace if provided
      const fullKey = namespace ? `${namespace}:${key}` : key;
      // Try with namespace first, then without
      return mockT(fullKey, options) !== fullKey ? mockT(fullKey, options) : mockT(key, options);
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock the i18n instance used in non-React contexts (e.g., errorMessages.ts)
vi.mock('@/app/i18n', () => ({
  default: {
    t: (key: string, options?: Record<string, unknown>) => mockT(key, options),
    changeLanguage: vi.fn(),
    language: 'en',
  },
  changeLanguage: vi.fn(),
  getCurrentLanguage: () => 'en',
}));

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

// Mock ResizeObserver (not implemented in jsdom)
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (not implemented in jsdom)
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress expected console errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React error boundary errors (expected in ErrorBoundary tests)
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ErrorBoundary') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Could not parse CSS stylesheet'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    // Suppress React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render') || args[0].includes('act('))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
