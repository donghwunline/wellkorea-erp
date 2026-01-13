/**
 * Invoice Create Modal
 *
 * Modal wrapper for creating a new invoice within project context.
 * Shows delivery line items with remaining invoiceable quantities.
 * Preserves user context by staying on the project page.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  FormField,
  Icon,
  Input,
  LoadingState,
  Modal,
  ModalActions,
} from '@/shared/ui';
import { quotationQueries, QuotationStatus, type LineItem } from '@/entities/quotation';
import { deliveryQueries, deliveryRules, type Delivery } from '@/entities/delivery';
import { invoiceQueries, type CreateInvoiceLineItemInput } from '@/entities/invoice';
import { useCreateInvoice } from '@/features/invoice/create';
import { formatCurrency } from '@/shared/lib/formatting';

export interface InvoiceCreateModalProps {
  /** Project ID to create invoice for */
  readonly projectId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful creation */
  readonly onSuccess?: () => void;
  /** Optional pre-selected delivery ID */
  readonly preselectedDeliveryId?: number;
}

interface InvoiceLineItemFormData {
  productId: number;
  productName: string;
  productSku: string | null;
  quotationQuantity: number;
  quotationUnitPrice: number;
  deliveredQuantity: number;
  invoicedQuantity: number;
  remainingQuantity: number;
}

/** Get today's date in YYYY-MM-DD format */
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get date 30 days from now in YYYY-MM-DD format */
function getDueDateDefault(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

// Default tax rate (10% VAT in Korea)
const DEFAULT_TAX_RATE = 10;

export function InvoiceCreateModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  preselectedDeliveryId,
}: InvoiceCreateModalProps) {
  // Form state
  const [issueDate, setIssueDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState(getDueDateDefault());
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [notes, setNotes] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(
    preselectedDeliveryId ?? null
  );
  const [quantitiesToInvoice, setQuantitiesToInvoice] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch approved quotation for the project
  const {
    data: quotationsData,
    isLoading: loadingQuotations,
    error: quotationsError,
  } = useQuery({
    ...quotationQueries.list({
      page: 0,
      size: 100,
      search: '',
      status: QuotationStatus.APPROVED,
      projectId,
    }),
    enabled: isOpen && projectId > 0,
  });

  // Find the latest approved quotation
  const approvedQuotation = useMemo(() => {
    if (!quotationsData?.data.length) return null;
    return quotationsData.data[0];
  }, [quotationsData]);

  // Fetch full quotation detail to get line items
  const { data: quotationDetail, isLoading: loadingQuotationDetail } = useQuery({
    ...quotationQueries.detail(approvedQuotation?.id ?? 0),
    enabled: isOpen && !!approvedQuotation?.id,
  });

  // Fetch deliveries for the project
  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery({
    ...deliveryQueries.list({ projectId }),
    enabled: isOpen && projectId > 0,
  });

  // Fetch existing invoices for the project (summary list)
  const { data: existingInvoiceSummaries = [], isLoading: loadingInvoices } = useQuery({
    ...invoiceQueries.byProject(projectId),
    enabled: isOpen && projectId > 0,
  });

  // Get IDs of non-cancelled invoices to fetch their full details
  const nonCancelledInvoiceIds = useMemo(
    () =>
      existingInvoiceSummaries
        .filter((inv) => inv.status !== 'CANCELLED')
        .map((inv) => inv.id),
    [existingInvoiceSummaries]
  );

  // Fetch full details for each non-cancelled invoice to get line items
  const invoiceDetailQueries = useQueries({
    queries: nonCancelledInvoiceIds.map((id) => ({
      ...invoiceQueries.detail(id),
      enabled: isOpen && id > 0,
    })),
  });

  const loadingInvoiceDetails = invoiceDetailQueries.some((q) => q.isLoading);
  const invoiceDetails = invoiceDetailQueries
    .map((q) => q.data)
    .filter((d): d is NonNullable<typeof d> => d !== undefined);

  // Derive line items data from quotation, deliveries, and existing invoices
  const lineItemsData = useMemo<InvoiceLineItemFormData[]>(() => {
    if (!quotationDetail?.lineItems) return [];

    // Build map of delivered quantities by productId (excludes RETURNED deliveries)
    const deliveredByProduct = deliveryRules.getDeliveredQuantityByProduct(deliveries);

    // Build map of invoiced quantities by productId from full invoice details
    const invoicedByProduct = new Map<number, number>();
    for (const invoice of invoiceDetails) {
      for (const item of invoice.lineItems) {
        const current = invoicedByProduct.get(item.productId) || 0;
        invoicedByProduct.set(item.productId, current + item.quantityInvoiced);
      }
    }

    // Build form data with remaining quantities
    return quotationDetail.lineItems.map((item: LineItem) => {
      const delivered = deliveredByProduct.get(item.productId) || 0;
      const invoiced = invoicedByProduct.get(item.productId) || 0;
      // Allow invoicing up to: delivered - already invoiced
      const remaining = Math.max(0, delivered - invoiced);
      return {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quotationQuantity: item.quantity,
        quotationUnitPrice: item.unitPrice,
        deliveredQuantity: delivered,
        invoicedQuantity: invoiced,
        remainingQuantity: remaining,
      };
    });
  }, [quotationDetail, deliveries, invoiceDetails]);

  // Handle delivery selection with auto-populate quantities
  const handleDeliveryChange = useCallback(
    (deliveryId: number | null) => {
      setSelectedDeliveryId(deliveryId);

      // Auto-populate quantities when a delivery is selected
      if (!deliveryId || !lineItemsData.length) {
        return;
      }

      const selectedDelivery = deliveries.find((d) => d.id === deliveryId);
      if (!selectedDelivery) {
        return;
      }

      // Build quantities from selected delivery, capped at remaining invoiceable qty
      const newQuantities: Record<number, number> = {};
      for (const deliveryItem of selectedDelivery.lineItems) {
        const lineItem = lineItemsData.find((li) => li.productId === deliveryItem.productId);
        if (lineItem && lineItem.remainingQuantity > 0) {
          // Take the lesser of: delivered qty from this delivery or remaining invoiceable qty
          newQuantities[deliveryItem.productId] = Math.min(
            deliveryItem.quantityDelivered,
            lineItem.remainingQuantity
          );
        }
      }

      setQuantitiesToInvoice(newQuantities);
    },
    [deliveries, lineItemsData]
  );

  // Calculate totals
  const { subtotal, taxAmount, total } = useMemo(() => {
    let subtotal = 0;
    for (const item of lineItemsData) {
      const qty = quantitiesToInvoice[item.productId] || 0;
      subtotal += qty * item.quotationUnitPrice;
    }
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [lineItemsData, quantitiesToInvoice, taxRate]);

  // Mutation hook
  const { mutate: createInvoice, isPending: isSubmitting } = useCreateInvoice({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setQuantitiesToInvoice((prev) => ({
      ...prev,
      [productId]: numValue,
    }));
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Build line items for submission (only items with quantity > 0)
      const lineItems: CreateInvoiceLineItemInput[] = lineItemsData
        .filter((item) => (quantitiesToInvoice[item.productId] || 0) > 0)
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantityInvoiced: quantitiesToInvoice[item.productId] || 0,
          unitPrice: item.quotationUnitPrice,
        }));

      if (lineItems.length === 0) {
        setError('Please enter quantity for at least one item');
        return;
      }

      // Validate quantities don't exceed remaining
      for (const item of lineItemsData) {
        const qtyToInvoice = quantitiesToInvoice[item.productId] || 0;
        if (qtyToInvoice > item.remainingQuantity) {
          setError(
            `Quantity for ${item.productName} exceeds invoiceable quantity (${item.remainingQuantity})`
          );
          return;
        }
      }

      // Validate dates
      if (new Date(dueDate) < new Date(issueDate)) {
        setError('Due date must be on or after issue date');
        return;
      }

      createInvoice({
        projectId,
        deliveryId: selectedDeliveryId,
        issueDate,
        dueDate,
        taxRate,
        notes: notes || undefined,
        lineItems,
      });
    },
    [
      projectId,
      issueDate,
      dueDate,
      taxRate,
      selectedDeliveryId,
      lineItemsData,
      quantitiesToInvoice,
      notes,
      createInvoice,
    ]
  );

  // Loading state
  const isLoading =
    loadingQuotations ||
    loadingDeliveries ||
    loadingQuotationDetail ||
    loadingInvoices ||
    loadingInvoiceDetails;

  // Check if there are any items with remaining quantity to invoice
  const hasInvoiceableItems = lineItemsData.some((item) => item.remainingQuantity > 0);

  // Calculate total quantity to invoice
  const totalToInvoice = lineItemsData.reduce(
    (sum, item) => sum + (quantitiesToInvoice[item.productId] || 0),
    0
  );

  // Delivery options for select
  const deliveryOptions = useMemo(() => {
    return [
      { value: '', label: 'No specific delivery (general invoice)' },
      ...deliveries.map((d: Delivery) => ({
        value: d.id.toString(),
        label: `Delivery #${d.id} - ${d.deliveryDate}`,
      })),
    ];
  }, [deliveries]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
        <LoadingState message="Loading project data..." />
      </Modal>
    );
  }

  if (quotationsError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
        <Alert variant="error">Failed to load quotation: {quotationsError.message}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  if (!approvedQuotation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
        <div className="py-8 text-center">
          <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">No Approved Quotation</h3>
          <p className="mt-2 text-steel-400">
            This project does not have an approved quotation. A quotation must be approved before
            creating invoices.
          </p>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  if (!hasInvoiceableItems) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
        <div className="py-8 text-center">
          <Icon name="check-circle" className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-white">All Items Invoiced</h3>
          <p className="mt-2 text-steel-400">
            All delivered items have been invoiced. No remaining items to invoice.
          </p>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Invoice" size="lg">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="mb-6 border-steel-700 bg-steel-800/50 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">Invoice Information</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FormField label="Issue Date" required>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Due Date" required>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={issueDate}
                required
              />
            </FormField>
            <FormField label="Tax Rate (%)" required>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                min={0}
                max={100}
                step={0.1}
                required
              />
            </FormField>
            <FormField label="Related Delivery">
              <select
                value={selectedDeliveryId?.toString() || ''}
                onChange={(e) =>
                  handleDeliveryChange(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              >
                {deliveryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this invoice"
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>
        </Card>

        <Card className="border-steel-700 bg-steel-800/50 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">Line Items</h3>
          <p className="mb-4 text-sm text-steel-400">
            Enter the quantity to invoice for each item. Only items with delivered quantity are
            shown.
          </p>

          {/* Line items table */}
          <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-steel-900">
                <tr className="border-b border-steel-700">
                  <th className="px-3 py-2 text-left text-xs font-medium text-steel-400">
                    Product
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Delivered
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Invoiced
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Invoiceable
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItemsData
                  .filter((item) => item.remainingQuantity > 0)
                  .map((item) => {
                    const qtyToInvoice = quantitiesToInvoice[item.productId] || 0;
                    const lineTotal = qtyToInvoice * item.quotationUnitPrice;
                    return (
                      <tr
                        key={item.productId}
                        className="border-b border-steel-800 hover:bg-steel-800/50"
                      >
                        <td className="px-3 py-2">
                          <div className="text-sm text-white">{item.productName}</div>
                          {item.productSku && (
                            <div className="text-xs text-steel-500">{item.productSku}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm text-steel-300">
                          {formatCurrency(item.quotationUnitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-steel-300">
                          {item.deliveredQuantity}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-steel-300">
                          {item.invoicedQuantity}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-copper-400">
                          {item.remainingQuantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.remainingQuantity}
                            step="0.01"
                            value={quantitiesToInvoice[item.productId] || ''}
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                            className="w-20 text-right text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm text-steel-300">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-steel-900">
                <tr className="border-t border-steel-700">
                  <td colSpan={5} className="px-3 py-2 text-right text-sm text-steel-400">
                    Total Items:
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-bold text-copper-400">
                    {totalToInvoice}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={6} className="px-3 py-1 text-right text-sm text-steel-400">
                    Subtotal:
                  </td>
                  <td className="px-3 py-1 text-right font-mono text-sm text-white">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-3 py-1 text-right text-sm text-steel-400">
                    Tax ({taxRate}%):
                  </td>
                  <td className="px-3 py-1 text-right font-mono text-sm text-white">
                    {formatCurrency(taxAmount)}
                  </td>
                </tr>
                <tr className="border-t border-steel-700">
                  <td colSpan={6} className="px-3 py-2 text-right text-sm font-semibold text-white">
                    Total:
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm font-bold text-copper-400">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || totalToInvoice === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
