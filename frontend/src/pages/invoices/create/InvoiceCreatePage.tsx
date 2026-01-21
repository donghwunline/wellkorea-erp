/**
 * Invoice Create Page
 *
 * Form for creating a new invoice for a project.
 * Shows delivery line items with remaining invoiceable quantities.
 *
 * Route: /projects/:projectId/invoices/create
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/quotation for fetching quotation data
 * - Uses entities/delivery for fetching delivery data
 * - Uses entities/invoice for fetching existing invoices
 * - Uses features/invoice/create for mutation
 */

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  FormField,
  Icon,
  Input,
  LoadingState,
  PageHeader,
} from '@/shared/ui';
import { quotationQueries, QuotationStatus, type LineItem } from '@/entities/quotation';
import { deliveryQueries, deliveryRules, type Delivery } from '@/entities/delivery';
import { invoiceQueries, type CreateInvoiceLineItemInput } from '@/entities/invoice';
import { useCreateInvoice } from '@/features/invoice/create';
import { formatCurrency } from '@/shared/lib/formatting';

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

export function InvoiceCreatePage() {
  const { t } = useTranslation('pages');
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdNum = Number(projectId);

  // Optional: Pre-select delivery from URL params
  const preselectedDeliveryId = searchParams.get('deliveryId')
    ? Number(searchParams.get('deliveryId'))
    : null;

  // Form state
  const [issueDate, setIssueDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState(getDueDateDefault());
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [notes, setNotes] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(
    preselectedDeliveryId
  );
  const [quantitiesToInvoice, setQuantitiesToInvoice] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch accepted quotation for the project
  const {
    data: quotationsData,
    isLoading: loadingQuotations,
    error: quotationsError,
  } = useQuery(
    quotationQueries.list({
      page: 0,
      size: 100,
      search: '',
      status: QuotationStatus.ACCEPTED,
      projectId: projectIdNum,
    })
  );

  // Find the latest accepted quotation
  const acceptedQuotation = useMemo(() => {
    if (!quotationsData?.data.length) return null;
    return quotationsData.data[0];
  }, [quotationsData]);

  // Fetch full quotation detail to get line items
  const { data: quotationDetail, isLoading: loadingQuotationDetail } = useQuery({
    ...quotationQueries.detail(acceptedQuotation?.id ?? 0),
    enabled: !!acceptedQuotation?.id,
  });

  // Fetch deliveries for the project
  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery(
    deliveryQueries.list({ projectId: projectIdNum })
  );

  // Fetch existing invoices for the project (summary list)
  const { data: existingInvoicesPage, isLoading: loadingInvoices } = useQuery(
    invoiceQueries.list({ projectId: projectIdNum, size: 100 })
  );

  // Get IDs of non-cancelled invoices to fetch their full details
  const nonCancelledInvoiceIds = useMemo(
    () =>
      (existingInvoicesPage?.data ?? [])
        .filter((inv) => inv.status !== 'CANCELLED')
        .map((inv) => inv.id),
    [existingInvoicesPage?.data]
  );

  // Fetch full details for each non-cancelled invoice to get line items
  const invoiceDetailQueries = useQueries({
    queries: nonCancelledInvoiceIds.map((id) => ({
      ...invoiceQueries.detail(id),
      enabled: id > 0,
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

  // Handle delivery selection change - auto-populate quantities
  const handleDeliveryChange = useCallback(
    (deliveryId: number | null) => {
      setSelectedDeliveryId(deliveryId);

      if (!deliveryId || !lineItemsData.length) {
        setQuantitiesToInvoice({});
        return;
      }

      const selectedDelivery = deliveries.find((d) => d.id === deliveryId);
      if (!selectedDelivery) {
        setQuantitiesToInvoice({});
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

  // One-time initialization for preselected delivery
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (!preselectedDeliveryId || !lineItemsData.length || !deliveries.length) return;
    initializedRef.current = true;
    // Only set quantities, don't call full handler to avoid setting deliveryId again
    const selectedDelivery = deliveries.find((d) => d.id === preselectedDeliveryId);
    if (!selectedDelivery) return;
    const newQuantities: Record<number, number> = {};
    for (const deliveryItem of selectedDelivery.lineItems) {
      const lineItem = lineItemsData.find((li) => li.productId === deliveryItem.productId);
      if (lineItem && lineItem.remainingQuantity > 0) {
        newQuantities[deliveryItem.productId] = Math.min(
          deliveryItem.quantityDelivered,
          lineItem.remainingQuantity
        );
      }
    }
    // Use queueMicrotask to defer setState and avoid lint warning about synchronous setState in effect
    queueMicrotask(() => setQuantitiesToInvoice(newQuantities));
  }, [preselectedDeliveryId, lineItemsData, deliveries]);

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
    onSuccess: (result) => {
      navigate(`/invoices/${result.id}`);
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
        setError(t('invoiceCreate.errors.noItems'));
        return;
      }

      // Validate quantities don't exceed remaining
      for (const item of lineItemsData) {
        const qtyToInvoice = quantitiesToInvoice[item.productId] || 0;
        if (qtyToInvoice > item.remainingQuantity) {
          setError(
            t('invoiceCreate.errors.exceedsQuantity', { product: item.productName, max: item.remainingQuantity })
          );
          return;
        }
      }

      // Validate dates
      if (new Date(dueDate) < new Date(issueDate)) {
        setError(t('invoiceCreate.errors.invalidDueDate'));
        return;
      }

      createInvoice({
        projectId: projectIdNum,
        quotationId: acceptedQuotation!.id,
        issueDate,
        dueDate,
        taxRate,
        notes: notes || undefined,
        lineItems,
      });
    },
    [
      projectIdNum,
      acceptedQuotation,
      issueDate,
      dueDate,
      taxRate,
      lineItemsData,
      quantitiesToInvoice,
      notes,
      createInvoice,
      t,
    ]
  );

  // Loading state
  const isLoading =
    loadingQuotations || loadingDeliveries || loadingQuotationDetail || loadingInvoices || loadingInvoiceDetails;

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
      { value: '', label: t('invoiceCreate.noDelivery') },
      ...deliveries.map((d: Delivery) => ({
        value: d.id.toString(),
        label: t('invoiceCreate.deliveryOption', { id: d.id, date: d.deliveryDate }),
      })),
    ];
  }, [deliveries, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message={t('invoiceCreate.loading')} />
        </Card>
      </div>
    );
  }

  if (quotationsError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('invoiceCreate.loadError')}: {quotationsError.message}</Alert>
      </div>
    );
  }

  if (!acceptedQuotation) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">{t('invoiceCreate.noAcceptedQuotation.title')}</h3>
          <p className="mt-2 text-steel-400">
            {t('invoiceCreate.noAcceptedQuotation.description')}
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            {t('invoiceCreate.backToProject')}
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasInvoiceableItems) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Icon name="check-circle" className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-white">{t('invoiceCreate.allItemsInvoiced.title')}</h3>
          <p className="mt-2 text-steel-400">
            {t('invoiceCreate.allItemsInvoiced.description')}
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            {t('invoiceCreate.backToProject')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={t('invoiceCreate.title')}
          description={t('invoiceCreate.description')}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)}>
            {t('invoiceCreate.cancel')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">{t('invoiceCreate.invoiceInfo')}</h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <FormField label={t('invoiceCreate.issueDate')} required>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t('invoiceCreate.dueDate')} required>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={issueDate}
                required
              />
            </FormField>
            <FormField label={t('invoiceCreate.taxRate')} required>
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
            <FormField label={t('invoiceCreate.relatedDelivery')}>
              <select
                value={selectedDeliveryId?.toString() || ''}
                onChange={(e) => handleDeliveryChange(e.target.value ? Number(e.target.value) : null)}
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
            <FormField label={t('invoiceCreate.notes')}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('invoiceCreate.notesPlaceholder')}
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">{t('invoiceCreate.lineItems.title')}</h3>
          <p className="mb-6 text-sm text-steel-400">
            {t('invoiceCreate.lineItems.description')}
          </p>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.product')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.unitPrice')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.delivered')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.invoiced')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.invoiceable')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.qtyToInvoice')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('invoiceCreate.lineItems.lineTotal')}
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
                        <td className="px-4 py-3">
                          <div className="text-white">{item.productName}</div>
                          {item.productSku && (
                            <div className="text-xs text-steel-500">{item.productSku}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-steel-300">
                          {formatCurrency(item.quotationUnitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-steel-300">
                          {item.deliveredQuantity}
                        </td>
                        <td className="px-4 py-3 text-right text-steel-300">
                          {item.invoicedQuantity}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-copper-400">
                          {item.remainingQuantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.remainingQuantity}
                            step="0.01"
                            value={quantitiesToInvoice[item.productId] || ''}
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                            className="w-24 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-steel-300">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t border-steel-700">
                  <td colSpan={5} className="px-4 py-3 text-right text-steel-400">
                    {t('invoiceCreate.totals.totalItems')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-copper-400">
                    {totalToInvoice}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-right text-steel-400">
                    {t('invoiceCreate.totals.subtotal')}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-white">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-right text-steel-400">
                    {t('invoiceCreate.totals.tax', { rate: taxRate })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-white">
                    {formatCurrency(taxAmount)}
                  </td>
                </tr>
                <tr className="border-t border-steel-700">
                  <td colSpan={6} className="px-4 py-3 text-right font-semibold text-white">
                    {t('invoiceCreate.totals.total')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-copper-400">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Submit button */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              {t('invoiceCreate.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || totalToInvoice === 0}>
              {isSubmitting ? t('invoiceCreate.submitting') : t('invoiceCreate.submit')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
