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
import { useTranslation } from 'react-i18next';
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
import { deliveryQueries, deliveryRules, type CreateDeliveryLineItemInput } from '@/entities/delivery';
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
  const { t } = useTranslation('deliveries');
  const { t: tCommon } = useTranslation('common');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectIdNum = Number(projectId);

  // Form state
  const [deliveryDate, setDeliveryDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');
  const [quantitiesToDeliver, setQuantitiesToDeliver] = useState<Record<number, number>>({});
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

  // Fetch existing deliveries for the project
  const {
    data: deliveries = [],
    isLoading: loadingDeliveries,
  } = useQuery(
    deliveryQueries.list({ projectId: projectIdNum })
  );

  // Find the latest accepted quotation
  const acceptedQuotation = useMemo(() => {
    if (!quotationsData?.data.length) return null;
    return quotationsData.data[0];
  }, [quotationsData]);

  // Fetch full quotation detail to get line items
  const {
    data: quotationDetail,
    isLoading: loadingQuotationDetail,
  } = useQuery({
    ...quotationQueries.detail(acceptedQuotation?.id ?? 0),
    enabled: !!acceptedQuotation?.id,
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

      // Guard: acceptedQuotation should exist when form is shown
      if (!acceptedQuotation) {
        setError(t('validation.noQuotationFound'));
        return;
      }

      // Build line items for submission (only items with quantity > 0)
      const lineItems: CreateDeliveryLineItemInput[] = lineItemsData
        .filter(item => (quantitiesToDeliver[item.productId] || 0) > 0)
        .map(item => ({
          productId: item.productId,
          quantityDelivered: quantitiesToDeliver[item.productId] || 0,
        }));

      if (lineItems.length === 0) {
        setError(t('validation.enterAtLeastOne'));
        return;
      }

      // Validate quantities don't exceed remaining
      for (const item of lineItemsData) {
        const qtyToDeliver = quantitiesToDeliver[item.productId] || 0;
        if (qtyToDeliver > item.remainingQuantity) {
          setError(
            t('validation.exceedsRemaining', { product: item.productName, remaining: item.remainingQuantity })
          );
          return;
        }
      }

      createDelivery({
        projectId: projectIdNum,
        quotationId: acceptedQuotation.id,
        deliveryDate,
        lineItems,
        notes: notes || undefined,
      });
    },
    [projectIdNum, acceptedQuotation, deliveryDate, lineItemsData, quantitiesToDeliver, notes, createDelivery, t]
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
          <LoadingState message={t('create.loading')} />
        </Card>
      </div>
    );
  }

  if (quotationsError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          {t('create.error')}: {quotationsError.message}
        </Alert>
      </div>
    );
  }

  if (!acceptedQuotation) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">{t('create.noQuotation')}</h3>
          <p className="mt-2 text-steel-400">
            {t('create.noQuotationDesc')}
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            {t('actions.backToProject')}
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
          <h3 className="text-lg font-semibold text-white">{t('create.allDelivered')}</h3>
          <p className="mt-2 text-steel-400">
            {t('create.allDeliveredDesc')}
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            {t('actions.backToProject')}
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
          title={t('create.title')}
          description={t('create.description')}
        />
        <PageHeader.Actions>
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            {tCommon('buttons.cancel')}
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
          <h3 className="mb-4 text-lg font-semibold text-white">{t('create.deliveryInfo')}</h3>
          <div className="grid grid-cols-2 gap-6">
            <FormField label={t('fields.deliveryDate')} required>
              <Input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                max={getTodayISO()}
                required
              />
            </FormField>
            <FormField label={t('fields.notes')}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('fields.notes')}
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">{t('lineItems.title')}</h3>
          <p className="mb-6 text-sm text-steel-400">
            {t('lineItems.enterQuantityHint')}
          </p>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-steel-400">
                    {t('lineItems.product')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('lineItems.quoted')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('lineItems.delivered')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('lineItems.remaining')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-steel-400">
                    {t('lineItems.toDeliver')}
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
                    {t('lineItems.totalToDeliver')}
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
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalToDeliver === 0}
            >
              {isSubmitting ? t('create.saving') : t('create.createButton')}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
