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
  'common:buttons.download': 'Download',
  'common:buttons.deactivate': 'Deactivate',

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

  // Product Selector translations
  'common:productSelector.product': 'Product',
  'common:productSelector.qty': 'Qty',
  'common:productSelector.unitPrice': 'Unit Price (KRW)',
  'common:productSelector.amount': 'Amount',
  'common:productSelector.note': 'Note',
  'common:productSelector.unit': 'Unit:',
  'common:productSelector.selected': 'Selected:',
  'common:productSelector.searchProduct': 'Search Product',
  'common:productSelector.searchPlaceholder': 'Search by name or SKU...',
  'common:productSelector.quantity': 'Quantity',
  'common:productSelector.optional': 'Optional',
  'common:productSelector.totalAmount': 'Total Amount:',
  'common:productSelector.emptyTitle': 'No products added yet.',
  'common:productSelector.emptyDescription': 'Search and add products to create your quotation.',
  'common:productSelector.removeItem': 'Remove item',

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

  // Quotation Panel translations
  'quotations:panel.loadingQuotations': 'Loading quotations...',
  'quotations:panel.loadingDetails': 'Loading quotation details...',
  'quotations:panel.noQuotationsTitle': 'No Quotations Yet',
  'quotations:panel.noQuotationsDescription': 'Create your first quotation for this project.',
  'quotations:panel.newQuotation': 'New Quotation',
  'quotations:panel.new': 'New',
  'quotations:panel.edit': 'Edit',
  'quotations:panel.submit': 'Submit',
  'quotations:panel.pdf': 'PDF',
  'quotations:panel.sendEmail': 'Send Email',
  'quotations:panel.accept': 'Accept',
  'quotations:panel.newVersion': 'New Version',
  'quotations:panel.submitSuccess': 'Quotation submitted for approval',
  'quotations:panel.acceptSuccess': 'Quotation accepted by customer',
  'quotations:panel.versionSuccess': 'New version created',
  'quotations:panel.emailSuccess': 'Email notification sent successfully',
  'quotations:panel.confirmSubmit.title': 'Submit for Approval',
  'quotations:panel.confirmSubmit.message': 'Are you sure you want to submit "{{jobCode}}" for approval?',
  'quotations:panel.confirmSubmit.confirm': 'Submit',
  'quotations:panel.confirmAccept.title': 'Accept Quotation',
  'quotations:panel.confirmAccept.message': 'Mark "{{jobCode}} v{{version}}" as accepted by customer?',
  'quotations:panel.confirmAccept.confirm': 'Accept',
  'quotations:panel.confirmVersion.title': 'Create New Version',
  'quotations:panel.confirmVersion.message': 'Create a new version based on "{{jobCode}} v{{version}}"?',
  'quotations:panel.confirmVersion.confirm': 'Create Version',
  'quotations:createModal.title': 'Create Quotation',
  'quotations:createModal.loadingProject': 'Loading project details...',
  'quotations:createModal.errorLoadingProject': 'Failed to load project details',

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

  // Record Reply Modal translations
  'purchasing:recordReplyModal.title': 'Record RFQ Reply',
  'purchasing:recordReplyModal.vendor': 'Vendor',
  'purchasing:recordReplyModal.fields.quotedPrice': 'Quoted Price',
  'purchasing:recordReplyModal.fields.quotedLeadTime': 'Lead Time (days)',
  'purchasing:recordReplyModal.fields.notes': 'Notes',
  'purchasing:recordReplyModal.placeholders.quotedPrice': 'Enter quoted price',
  'purchasing:recordReplyModal.placeholders.quotedLeadTime': 'Enter lead time in days',
  'purchasing:recordReplyModal.placeholders.notes': 'Additional notes',
  'purchasing:recordReplyModal.hints.quotedPrice': 'Price per unit in KRW',
  'purchasing:recordReplyModal.hints.quotedLeadTime': 'Expected delivery time in business days',
  'purchasing:recordReplyModal.hints.notes': 'Any additional information from vendor',
  'purchasing:recordReplyModal.validation.quotedPriceRequired': 'Quoted price is required',
  'purchasing:recordReplyModal.validation.quotedPriceInvalid': 'Please enter a valid positive number',
  'purchasing:recordReplyModal.validation.leadTimeInvalid': 'Please enter a valid positive number',
  'purchasing:recordReplyModal.saving': 'Saving...',

  // Create Purchase Order Modal translations
  'purchasing:createPurchaseOrderModal.title': 'Create Purchase Order',
  'purchasing:createPurchaseOrderModal.info.vendor': 'Vendor',
  'purchasing:createPurchaseOrderModal.info.quotedPrice': 'Quoted Price',
  'purchasing:createPurchaseOrderModal.info.quantity': 'Quantity',
  'purchasing:createPurchaseOrderModal.info.leadTime': 'Lead Time',
  'purchasing:createPurchaseOrderModal.info.leadTimeDays': '{{days}} days',
  'purchasing:createPurchaseOrderModal.info.totalAmount': 'Total Amount',
  'purchasing:createPurchaseOrderModal.fields.orderDate': 'Order Date',
  'purchasing:createPurchaseOrderModal.fields.expectedDeliveryDate': 'Expected Delivery Date',
  'purchasing:createPurchaseOrderModal.fields.notes': 'Notes',
  'purchasing:createPurchaseOrderModal.placeholders.notes': 'Additional order notes',
  'purchasing:createPurchaseOrderModal.hints.vendorLeadTime': 'Based on vendor lead time of {{days}} days',
  'purchasing:createPurchaseOrderModal.hints.notes': 'Optional instructions or notes for the vendor',
  'purchasing:createPurchaseOrderModal.validation.orderDateRequired': 'Order date is required',
  'purchasing:createPurchaseOrderModal.validation.expectedDeliveryDateRequired': 'Expected delivery date is required',
  'purchasing:createPurchaseOrderModal.validation.expectedDeliveryDateInvalid': 'Expected delivery date must be after order date',
  'purchasing:createPurchaseOrderModal.creating': 'Creating...',
  'purchasing:createPurchaseOrderModal.createButton': 'Create Purchase Order',

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

  // Product Form Modal translations
  'items:productFormModal.addTitle': 'Add Product',
  'items:productFormModal.editTitle': 'Edit Product',
  'items:productFormModal.createError': 'Failed to create product',
  'items:productFormModal.updateError': 'Failed to update product',

  // Material Category Form translations
  'items:materialCategoryForm.fields.name': 'Category Name',
  'items:materialCategoryForm.fields.description': 'Description',
  'items:materialCategoryForm.placeholders.name': 'e.g., Raw Materials',
  'items:materialCategoryForm.placeholders.description': 'Optional description of this category',
  'items:materialCategoryForm.validation.nameRequired': 'Category name is required',
  'items:materialCategoryForm.validation.nameMinLength': 'Name must be at least 2 characters',
  'items:materialCategoryForm.validation.nameMaxLength': 'Name must not exceed 100 characters',
  'items:materialCategoryForm.saveChanges': 'Save Changes',
  'items:materialCategoryForm.createCategory': 'Create Category',
  'items:materialCategoryFormModal.addTitle': 'Add Material Category',
  'items:materialCategoryFormModal.editTitle': 'Edit Material Category',
  'items:materialCategoryFormModal.createError': 'Failed to create category',
  'items:materialCategoryFormModal.updateError': 'Failed to update category',

  // Delete Material Category Modal translations
  'items:deleteMaterialCategoryModal.title': 'Deactivate Category',
  'items:deleteMaterialCategoryModal.message': 'Are you sure you want to deactivate "{{name}}"?',
  'items:deleteMaterialCategoryModal.materialCountWarning': 'This category contains {{count}} material(s).',

  // Service Category Form translations
  'items:serviceCategoryForm.fields.name': 'Category Name',
  'items:serviceCategoryForm.fields.description': 'Description',
  'items:serviceCategoryForm.placeholders.name': 'e.g., Laser Cutting',
  'items:serviceCategoryForm.placeholders.description': 'Optional description of this service category',
  'items:serviceCategoryForm.validation.nameRequired': 'Category name is required',
  'items:serviceCategoryForm.validation.nameMinLength': 'Name must be at least 2 characters',
  'items:serviceCategoryForm.validation.nameMaxLength': 'Name must not exceed 100 characters',
  'items:serviceCategoryForm.saveChanges': 'Save Changes',
  'items:serviceCategoryForm.createCategory': 'Create Category',
  'items:serviceCategoryFormModal.addTitle': 'Add Service Category',
  'items:serviceCategoryFormModal.editTitle': 'Edit Service Category',
  'items:serviceCategoryFormModal.createError': 'Failed to create category',
  'items:serviceCategoryFormModal.updateError': 'Failed to update category',

  // Delete Service Category Modal translations
  'items:deleteServiceCategoryModal.title': 'Deactivate Category',
  'items:deleteServiceCategoryModal.message': 'Are you sure you want to deactivate "{{name}}"?',
  'items:deleteServiceCategoryModal.vendorCountWarning': 'This category has {{count}} vendor offering(s) associated with it.',

  // Material Form translations
  'items:materialForm.fields.sku': 'SKU',
  'items:materialForm.fields.name': 'Name',
  'items:materialForm.fields.description': 'Description',
  'items:materialForm.fields.categoryId': 'Category',
  'items:materialForm.fields.unit': 'Unit',
  'items:materialForm.fields.standardPrice': 'Standard Price',
  'items:materialForm.placeholders.sku': 'e.g., MAT-001',
  'items:materialForm.placeholders.name': 'e.g., Steel Sheet',
  'items:materialForm.placeholders.description': 'Optional description',
  'items:materialForm.placeholders.selectCategory': 'Select category',
  'items:materialForm.placeholders.unit': 'e.g., kg, m, pcs',
  'items:materialForm.validation.skuRequired': 'SKU is required',
  'items:materialForm.validation.nameRequired': 'Name is required',
  'items:materialForm.validation.categoryRequired': 'Category is required',
  'items:materialForm.validation.priceNegative': 'Price cannot be negative',
  'items:materialForm.saveChanges': 'Save Changes',
  'items:materialForm.createMaterial': 'Create Material',
  'items:materialFormModal.addTitle': 'Add Material',
  'items:materialFormModal.editTitle': 'Edit Material',
  'items:materialFormModal.createError': 'Failed to create material',
  'items:materialFormModal.updateError': 'Failed to update material',

  // Delete Material Modal translations
  'items:deleteMaterialModal.title': 'Deactivate Material',
  'items:deleteMaterialModal.message': 'Are you sure you want to deactivate "{{name}}" ({{sku}})?',
  'items:deleteMaterialModal.confirm': 'Deactivate',

  // Vendor Offering Form translations
  'items:vendorOfferingForm.fields.vendor': 'Vendor',
  'items:vendorOfferingForm.fields.category': 'Service Category',
  'items:vendorOfferingForm.fields.vendorServiceCode': 'Vendor Service Code',
  'items:vendorOfferingForm.fields.vendorServiceName': 'Vendor Service Name',
  'items:vendorOfferingForm.fields.unitPrice': 'Unit Price',
  'items:vendorOfferingForm.fields.currency': 'Currency',
  'items:vendorOfferingForm.fields.leadTimeDays': 'Lead Time (days)',
  'items:vendorOfferingForm.fields.effectivePeriod': 'Effective Period',
  'items:vendorOfferingForm.fields.isPreferred': 'Mark as Preferred Vendor',
  'items:vendorOfferingForm.fields.notes': 'Notes',
  'items:vendorOfferingForm.placeholders.searchVendors': 'Search vendors...',
  'items:vendorOfferingForm.placeholders.selectCategory': 'Select category',
  'items:vendorOfferingForm.placeholders.vendorServiceCode': "Vendor's internal code",
  'items:vendorOfferingForm.placeholders.vendorServiceName': "Vendor's service name",
  'items:vendorOfferingForm.placeholders.selectDateRange': 'Select date range',
  'items:vendorOfferingForm.placeholders.notes': 'Additional notes',
  'items:vendorOfferingForm.validation.vendorRequired': 'Vendor is required',
  'items:vendorOfferingForm.validation.categoryRequired': 'Category is required',
  'items:vendorOfferingForm.validation.unitPriceNegative': 'Price cannot be negative',
  'items:vendorOfferingForm.validation.leadTimeNegative': 'Lead time cannot be negative',
  'items:vendorOfferingForm.validation.dateRangeInvalid': 'End date must be after start date',
  'items:vendorOfferingForm.saveChanges': 'Save Changes',
  'items:vendorOfferingForm.createOffering': 'Create Offering',
  'items:vendorOfferingFormModal.addTitle': 'Add Vendor Offering',
  'items:vendorOfferingFormModal.editTitle': 'Edit Vendor Offering',
  'items:vendorOfferingFormModal.createError': 'Failed to create offering',
  'items:vendorOfferingFormModal.updateError': 'Failed to update offering',
  'items:vendorOfferingFormModal.validationError': 'Please select both vendor and category',

  // Delete Vendor Offering Modal translations
  'items:deleteVendorOfferingModal.title': 'Delete Vendor Offering',
  'items:deleteVendorOfferingModal.message': 'Are you sure you want to delete the offering "{{name}}" from {{vendor}}? {{price}}',

  // Vendor Material Offering Form translations
  'items:vendorMaterialOfferingForm.fields.vendor': 'Vendor',
  'items:vendorMaterialOfferingForm.fields.material': 'Material',
  'items:vendorMaterialOfferingForm.fields.vendorMaterialCode': 'Vendor Material Code',
  'items:vendorMaterialOfferingForm.fields.vendorMaterialName': 'Vendor Material Name',
  'items:vendorMaterialOfferingForm.fields.unitPrice': 'Unit Price',
  'items:vendorMaterialOfferingForm.fields.currency': 'Currency',
  'items:vendorMaterialOfferingForm.fields.leadTimeDays': 'Lead Time (days)',
  'items:vendorMaterialOfferingForm.fields.minOrderQuantity': 'Min. Order Quantity',
  'items:vendorMaterialOfferingForm.fields.effectivePeriod': 'Effective Period',
  'items:vendorMaterialOfferingForm.fields.isPreferred': 'Mark as Preferred Vendor',
  'items:vendorMaterialOfferingForm.fields.notes': 'Notes',
  'items:vendorMaterialOfferingForm.placeholders.searchVendors': 'Search vendors...',
  'items:vendorMaterialOfferingForm.placeholders.selectMaterial': 'Select material',
  'items:vendorMaterialOfferingForm.placeholders.vendorMaterialCode': "Vendor's part number",
  'items:vendorMaterialOfferingForm.placeholders.vendorMaterialName': "Vendor's product name",
  'items:vendorMaterialOfferingForm.placeholders.selectDateRange': 'Select date range',
  'items:vendorMaterialOfferingForm.placeholders.notes': 'Additional notes',
  'items:vendorMaterialOfferingForm.validation.vendorRequired': 'Vendor is required',
  'items:vendorMaterialOfferingForm.validation.materialRequired': 'Material is required',
  'items:vendorMaterialOfferingForm.validation.unitPriceNegative': 'Price cannot be negative',
  'items:vendorMaterialOfferingForm.validation.leadTimeNegative': 'Lead time cannot be negative',
  'items:vendorMaterialOfferingForm.validation.minQuantityNegative': 'Minimum quantity cannot be negative',
  'items:vendorMaterialOfferingForm.validation.dateRangeInvalid': 'End date must be after start date',
  'items:vendorMaterialOfferingForm.saveChanges': 'Save Changes',
  'items:vendorMaterialOfferingForm.createOffering': 'Create Offering',
  'items:vendorMaterialOfferingFormModal.addTitle': 'Add Vendor Material Offering',
  'items:vendorMaterialOfferingFormModal.editTitle': 'Edit Vendor Material Offering',
  'items:vendorMaterialOfferingFormModal.createError': 'Failed to create offering',
  'items:vendorMaterialOfferingFormModal.updateError': 'Failed to update offering',
  'items:vendorMaterialOfferingFormModal.validationError': 'Please select both vendor and material',

  // Delete Vendor Material Offering Modal translations
  'items:deleteVendorMaterialOfferingModal.title': 'Delete Vendor Material Offering',
  'items:deleteVendorMaterialOfferingModal.message': 'Are you sure you want to delete the offering "{{name}}" from {{vendor}}? {{price}}',

  // Attachment translations
  'items:downloadButton.error': 'Failed to download {{fileName}}',
  'items:attachmentUploader.uploading': 'Uploading...',
  'items:attachmentUploader.clickToUpload': 'Click to upload',
  'items:attachmentUploader.orDragDrop': 'or drag and drop',
  'items:attachmentUploader.maxSize': 'max {{size}}',
  'items:attachmentUploader.validation.fileTypeNotAllowed': 'File type not allowed. Allowed types: {{types}}',
  'items:attachmentUploader.validation.fileSizeExceeds': 'File size exceeds maximum of {{maxSize}}',
  'items:deleteAttachmentButton.deleting': 'Deleting...',

  // Job Code Success Modal translations
  'items:jobCodeSuccessModal.title': 'Project Created Successfully',
  'items:jobCodeSuccessModal.message': 'Your project has been created with the following Job Code:',
  'items:jobCodeSuccessModal.copied': 'Copied!',
  'items:jobCodeSuccessModal.copyToClipboard': 'Copy to clipboard',
  'items:jobCodeSuccessModal.copiedMessage': 'Copied to clipboard!',
  'items:jobCodeSuccessModal.hint': 'Use this Job Code to reference this project in quotations, production, and invoicing.',
  'items:jobCodeSuccessModal.backToList': 'Back to List',
  'items:jobCodeSuccessModal.viewProject': 'View Project',

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

  // User Table translations
  'admin:userTable.user': 'User',
  'admin:userTable.roles': 'Roles',
  'admin:userTable.status': 'Status',
  'admin:userTable.lastLogin': 'Last Login',
  'admin:userTable.actions': 'Actions',
  'admin:userTable.active': 'Active',
  'admin:userTable.inactive': 'Inactive',
  'admin:userTable.empty': 'No users found.',
  'admin:userTable.editUser': 'Edit user',
  'admin:userTable.manageRoles': 'Manage roles',
  'admin:userTable.changePassword': 'Change password',
  'admin:userTable.assignCustomers': 'Assign customers',
  'admin:userTable.deactivateUser': 'Deactivate user',
  'admin:userTable.activateUser': 'Activate user',

  // User Roles Form translations
  'admin:userRolesForm.title': 'Manage User Roles',
  'admin:userRolesForm.subtitle': 'Assign roles for {{username}}',
  'admin:userRolesForm.availableRoles': 'Available Roles',
  'admin:userRolesForm.noRoles': 'No roles available',
  'admin:userRolesForm.saveChanges': 'Save Changes',
  'admin:userRolesForm.saving': 'Saving...',

  // User Deactivate Modal translations
  'admin:userDeactivate.title': 'Deactivate User',
  'admin:userDeactivate.message': 'Are you sure you want to deactivate "{{username}}"? This user will no longer be able to access the system.',
  'admin:userDeactivate.confirm': 'Deactivate',

  // User Customers Form translations
  'admin:userCustomersForm.title': 'Assign Customers',
  'admin:userCustomersForm.subtitle': 'Assign customers for {{username}}',
  'admin:userCustomersForm.search': 'Search customers...',
  'admin:userCustomersForm.noCustomers': 'No customers available',
  'admin:userCustomersForm.noResults': 'No customers found matching your search',
  'admin:userCustomersForm.selected': 'Selected: {{count}}',
  'admin:userCustomersForm.saveChanges': 'Save Changes',
  'admin:userCustomersForm.saving': 'Saving...',

  // Approval Card translations
  'approval:card.submittedBy': 'Submitted By',
  'approval:card.submittedAt': 'Submitted At',
  'approval:card.currentLevel': 'Current Level',
  'approval:card.levelOf': 'Level {{current}} of {{total}}',
  'approval:card.status': 'Status',
  'approval:card.approvalProgress': 'Approval Progress',
  'approval:card.viewDetails': 'View Details',
  'approval:buttons.approve': 'Approve',
  'approval:buttons.reject': 'Reject',
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
  useTranslation: (namespace?: string | string[]) => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // If key already has namespace prefix, use as-is
      if (key.includes(':')) {
        return mockT(key, options);
      }

      // Handle array of namespaces - try each in order
      if (Array.isArray(namespace)) {
        for (const ns of namespace) {
          const fullKey = `${ns}:${key}`;
          const result = mockT(fullKey, options);
          if (result !== fullKey) {
            return result;
          }
        }
        // If no namespace matched, try without namespace
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
