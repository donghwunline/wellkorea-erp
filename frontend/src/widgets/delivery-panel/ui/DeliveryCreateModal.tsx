/**
 * Delivery Create Modal
 *
 * Modal wrapper for creating a new delivery within project context.
 * Shows quotation line items with remaining deliverable quantities.
 * Preserves user context by staying on the project page.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { deliveryQueries, deliveryRules, type CreateDeliveryLineItemInput } from '@/entities/delivery';
import { useCreateDelivery } from '@/features/delivery/create';

export interface DeliveryCreateModalProps {
  /** Project ID to create delivery for */
  readonly projectId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful creation */
  readonly onSuccess?: () => void;
}

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

export function DeliveryCreateModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: DeliveryCreateModalProps) {
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

  // Fetch existing deliveries for the project
  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery({
    ...deliveryQueries.list({ projectId }),
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

  // Derive line items data from quotation and deliveries
  const lineItemsData = useMemo<DeliveryLineItemFormData[]>(() => {
    if (!quotationDetail?.lineItems) return [];

    // Get delivered quantities by product (excludes RETURNED deliveries)
    const deliveredByProduct = deliveryRules.getDeliveredQuantityByProduct(deliveries);

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

  // Check if there are any items with remaining quantity
  const hasRemainingItems = lineItemsData.some(item => item.remainingQuantity > 0);

  // Calculate total quantity to deliver
  const totalToDeliver = lineItemsData.reduce(
    (sum, item) => sum + (quantitiesToDeliver[item.productId] || 0),
    0
  );

  // Mutation hook
  const { mutate: createDelivery, isPending: isSubmitting } = useCreateDelivery({
    onSuccess: () => {
      // Reset form
      setDeliveryDate(getTodayISO());
      setNotes('');
      setQuantitiesToDeliver({});
      setError(null);
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
    setQuantitiesToDeliver(prev => ({
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
        projectId,
        quotationId: approvedQuotation!.id,
        deliveryDate,
        lineItems,
        notes: notes || undefined,
      });
    },
    [projectId, approvedQuotation, deliveryDate, lineItemsData, quantitiesToDeliver, notes, createDelivery]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setDeliveryDate(getTodayISO());
    setNotes('');
    setQuantitiesToDeliver({});
    setError(null);
    onClose();
  }, [onClose]);

  // Loading state
  const isLoading = loadingQuotations || loadingDeliveries || loadingQuotationDetail;

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Record Delivery" size="lg">
        <LoadingState message="Loading quotation data..." />
      </Modal>
    );
  }

  if (quotationsError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Record Delivery" size="lg">
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
      <Modal isOpen={isOpen} onClose={onClose} title="Record Delivery" size="lg">
        <div className="py-8 text-center">
          <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">No Approved Quotation</h3>
          <p className="mt-2 text-steel-400">
            This project does not have an approved quotation. A quotation must be approved before
            recording deliveries.
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

  if (!hasRemainingItems) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Record Delivery" size="lg">
        <div className="py-8 text-center">
          <Icon name="check-circle" className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-white">All Items Delivered</h3>
          <p className="mt-2 text-steel-400">
            All quotation items have been fully delivered. No remaining items to deliver.
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
    <Modal isOpen={isOpen} onClose={onClose} title="Record Delivery" size="lg">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="mb-6 border-steel-700 bg-steel-800/50 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">Delivery Information</h3>
          <div className="grid grid-cols-2 gap-4">
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

        <Card className="border-steel-700 bg-steel-800/50 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">Line Items</h3>
          <p className="mb-4 text-sm text-steel-400">
            Enter the quantity delivered for each item. Only items with remaining quantity are
            shown.
          </p>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="px-3 py-2 text-left text-xs font-medium text-steel-400">
                    Product
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Quoted
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Delivered
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Remaining
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-steel-400">
                    Qty to Deliver
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItemsData
                  .filter(item => item.remainingQuantity > 0)
                  .map(item => (
                    <tr key={item.productId} className="border-b border-steel-800">
                      <td className="px-3 py-2">
                        <div className="text-white">{item.productName}</div>
                        {item.productSku && (
                          <div className="text-xs text-steel-500">{item.productSku}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-steel-300">
                        {item.quotationQuantity}
                      </td>
                      <td className="px-3 py-2 text-right text-steel-300">
                        {item.deliveredQuantity}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-copper-400">
                        {item.remainingQuantity}
                      </td>
                      <td className="px-3 py-2 text-right">
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
                  <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-white">
                    Total Quantity to Deliver:
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm font-bold text-copper-400">
                    {totalToDeliver}
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
          <Button type="submit" variant="primary" disabled={isSubmitting || totalToDeliver === 0}>
            {isSubmitting ? 'Creating...' : 'Create Delivery'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
