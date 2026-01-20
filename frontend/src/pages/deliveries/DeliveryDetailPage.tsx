/**
 * Delivery Detail Page
 *
 * Displays delivery details including line items.
 * Allows downloading the delivery statement PDF.
 *
 * Route: /deliveries/:id
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/delivery for query hooks and UI
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Icon,
  LoadingState,
  PageHeader,
  Table,
} from '@/shared/ui';
import {
  deliveryQueries,
  DeliveryStatusBadge,
  deliveryRules,
  downloadDeliveryStatement,
} from '@/entities/delivery';
import { formatDate, formatDateTime } from '@/shared/lib/formatting';

export function DeliveryDetailPage() {
  const { t } = useTranslation('deliveries');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deliveryId = Number(id);

  // Fetch delivery detail
  const {
    data: delivery,
    isLoading,
    error: fetchError,
  } = useQuery(deliveryQueries.detail(deliveryId));

  // Track download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle PDF download
  const handleDownloadStatement = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadDeliveryStatement(deliveryId);
    } catch (error) {
      console.error('Failed to download statement:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [deliveryId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message={t('view.loading')} />
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          {t('view.loadError')}: {fetchError.message}
        </Alert>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate('/deliveries')}
        >
          {t('actions.backToList')}
        </Button>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('view.notFound')}</Alert>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate('/deliveries')}
        >
          {t('actions.backToList')}
        </Button>
      </div>
    );
  }

  const totalQuantity = deliveryRules.getTotalQuantity(delivery);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={`${t('title')} #${delivery.id}`}
          description={`${t('fields.project')}: ${delivery.jobCode}`}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={() => navigate('/deliveries')}>
            {t('actions.backToList')}
          </Button>
          <Button variant="secondary" onClick={handleDownloadStatement} disabled={isDownloading}>
            {isDownloading ? (
              <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
            )}
            {t('actions.downloadStatement')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Delivery Info Card */}
      <Card className="mb-6 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm text-steel-400">{t('fields.status')}</div>
            <div className="mt-1">
              <DeliveryStatusBadge status={delivery.status} />
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.deliveryDate')}</div>
            <div className="mt-1 text-white">{formatDate(delivery.deliveryDate)}</div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{tCommon('fields.deliveredBy')}</div>
            <div className="mt-1 text-white">{delivery.deliveredByName}</div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.project')}</div>
            <div className="mt-1">
              <Link
                to={`/projects/${delivery.projectId}`}
                className="text-copper-400 hover:underline"
              >
                {delivery.jobCode}
              </Link>
            </div>
          </div>
        </div>

        {delivery.notes && (
          <div className="mt-6 border-t border-steel-700 pt-4">
            <div className="text-sm text-steel-400">{t('fields.notes')}</div>
            <div className="mt-1 text-steel-300">{delivery.notes}</div>
          </div>
        )}

        <div className="mt-6 border-t border-steel-700 pt-4 text-xs text-steel-500">
          {tCommon('fields.createdAt')}: {formatDateTime(delivery.createdAt)} | {tCommon('fields.updatedAt')}:{' '}
          {formatDateTime(delivery.updatedAt)}
        </div>
      </Card>

      {/* Line Items Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{t('view.deliveredItems')}</h3>
          <span className="text-steel-400">
            {t('view.itemCount', { count: delivery.lineItems.length, total: totalQuantity })}
          </span>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('lineItems.product')}</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell className="text-right">{t('lineItems.shippedQuantity')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {delivery.lineItems.map(item => (
              <Table.Row key={item.id}>
                <Table.Cell className="font-medium text-white">
                  {item.productName}
                </Table.Cell>
                <Table.Cell className="text-steel-400">
                  {item.productSku || '-'}
                </Table.Cell>
                <Table.Cell className="text-right font-medium text-copper-400">
                  {item.quantityDelivered}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <tfoot>
            <tr className="border-t border-steel-700">
              <td colSpan={2} className="px-4 py-3 text-right font-medium text-white">
                {t('view.total')}:
              </td>
              <td className="px-4 py-3 text-right font-bold text-copper-400">
                {totalQuantity}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
