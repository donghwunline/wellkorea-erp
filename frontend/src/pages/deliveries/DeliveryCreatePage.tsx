/**
 * Delivery Create Page
 *
 * Form for creating a new delivery for a project.
 * Shows quotation line items with remaining deliverable quantities.
 *
 * Route: /projects/:projectId/deliveries/create
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/quotation for fetching quotation data
 * - Uses entities/delivery for fetching existing deliveries
 * - Uses features/delivery/create for mutation
 */

import { useCallback, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { deliveryQueries, type CreateDeliveryLineItemInput } from '@/entities/delivery';
import { useCreateDelivery } from '@/features/delivery/create';

interface DeliveryLineItemFormData {
  productId: number;
  productName: string;
  productSku: string;
  quotationQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
}

/** Get today's date in YYYY-MM-DD format */
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function DeliveryCreatePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectIdNum = Number(projectId);

  // Form state
  const [deliveryDate, setDeliveryDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');
  const [quantitiesToDeliver, setQuantitiesToDeliver] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch approved quotation for the project
  const {
    data: quotationsData,
    isLoading: loadingQuotations,
    error: quotationsError,
  } = useQuery(
    quotationQueries.list({
      page: 0,
      size: 100,
      search: '',
      status: QuotationStatus.APPROVED,
      projectId: projectIdNum,
    })
  );

  // Fetch existing deliveries for the project
  const {
    data: deliveries = [],
    isLoading: loadingDeliveries,
  } = useQuery(
    deliveryQueries.list({ projectId: projectIdNum })
  );

  // Find the latest approved quotation
  const approvedQuotation = useMemo(() => {
    if (!quotationsData?.data.length) return null;
    return quotationsData.data[0];
  }, [quotationsData]);

  // Fetch full quotation detail to get line items
  const {
    data: quotationDetail,
    isLoading: loadingQuotationDetail,
  } = useQuery({
    ...quotationQueries.detail(approvedQuotation?.id ?? 0),
    enabled: !!approvedQuotation?.id,
  });

  // Derive line items data from quotation and deliveries
  const lineItemsData = useMemo<DeliveryLineItemFormData[]>(() => {
    if (!quotationDetail?.lineItems) return [];

    // Build map of delivered quantities by productId
    const deliveredByProduct = new Map<number, number>();
    for (const delivery of deliveries) {
      for (const item of delivery.lineItems) {
        const current = deliveredByProduct.get(item.productId) || 0;
        deliveredByProduct.set(item.productId, current + item.quantityDelivered);
      }
    }

    // Build form data with remaining quantities
    return quotationDetail.lineItems.map((item: LineItem) => {
      const delivered = deliveredByProduct.get(item.productId) || 0;
      const remaining = Math.max(0, item.quantity - delivered);
      return {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quotationQuantity: item.quantity,
        deliveredQuantity: delivered,
        remainingQuantity: remaining,
      };
    });
  }, [quotationDetail, deliveries]);

  // Mutation hook
  const { mutate: createDelivery, isPending: isSubmitting } = useCreateDelivery({
    onSuccess: () => {
      navigate(`/projects/${projectId}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (productId: number, value: string) => {
      const numValue = parseFloat(value) || 0;
      setQuantitiesToDeliver(prev => ({
        ...prev,
        [productId]: numValue,
      }));
    },
    []
  );

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Build line items for submission (only items with quantity > 0)
      const lineItems: CreateDeliveryLineItemInput[] = lineItemsData
        .filter(item => (quantitiesToDeliver[item.productId] || 0) > 0)
        .map(item => ({
          productId: item.productId,
          quantityDelivered: quantitiesToDeliver[item.productId] || 0,
        }));

      if (lineItems.length === 0) {
        setError('Please enter quantity for at least one item');
        return;
      }

      // Validate quantities don't exceed remaining
      for (const item of lineItemsData) {
        const qtyToDeliver = quantitiesToDeliver[item.productId] || 0;
        if (qtyToDeliver > item.remainingQuantity) {
          setError(
            `Quantity for ${item.productName} exceeds remaining deliverable quantity (${item.remainingQuantity})`
          );
          return;
        }
      }

      createDelivery({
        projectId: projectIdNum,
        deliveryDate,
        lineItems,
        notes: notes || undefined,
      });
    },
    [projectIdNum, deliveryDate, lineItemsData, quantitiesToDeliver, notes, createDelivery]
  );

  // Loading state
  const isLoading = loadingQuotations || loadingDeliveries || loadingQuotationDetail;

  // Check if there are any items with remaining quantity
  const hasRemainingItems = lineItemsData.some(item => item.remainingQuantity > 0);

  // Calculate total quantity to deliver
  const totalToDeliver = lineItemsData.reduce(
    (sum, item) => sum + (quantitiesToDeliver[item.productId] || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message="Loading quotation data..." />
        </Card>
      </div>
    );
  }

  if (quotationsError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          Failed to load quotation: {quotationsError.message}
        </Alert>
      </div>
    );
  }

  if (!approvedQuotation) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">No Approved Quotation</h3>
          <p className="mt-2 text-steel-400">
            This project does not have an approved quotation. A quotation must be approved before
            recording deliveries.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to Project
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasRemainingItems) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Icon name="check-circle" className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-white">All Items Delivered</h3>
          <p className="mt-2 text-steel-400">
            All quotation items have been fully delivered. No remaining items to deliver.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to Project
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
          title="새 출고 등록"
          description="Record a new delivery for this project"
        />
        <PageHeader.Actions>
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Cancel
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
          <h3 className="mb-4 text-lg font-semibold text-white">Delivery Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Delivery Date" required>
              <Input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                max={getTodayISO()}
                required
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes about this delivery"
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Line Items</h3>
          <p className="mb-6 text-sm text-steel-400">
            Enter the quantity delivered for each item. Only items with remaining quantity are shown.
          </p>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-steel-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    Quoted
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    Delivered
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    Qty to Deliver
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItemsData
                  .filter(item => item.remainingQuantity > 0)
                  .map(item => (
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
                      <td className="px-4 py-3 text-right text-steel-300">
                        {item.quotationQuantity}
                      </td>
                      <td className="px-4 py-3 text-right text-steel-300">
                        {item.deliveredQuantity}
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
                          value={quantitiesToDeliver[item.productId] || ''}
                          onChange={e => handleQuantityChange(item.productId, e.target.value)}
                          className="w-24 text-right"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-steel-700">
                  <td colSpan={4} className="px-4 py-3 text-right font-medium text-white">
                    Total Quantity to Deliver:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-copper-400">
                    {totalToDeliver}
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalToDeliver === 0}
            >
              {isSubmitting ? 'Saving...' : 'Create Delivery'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
