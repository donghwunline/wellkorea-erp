/**
 * Delivery Panel Widget
 *
 * Displays delivery information for a project including:
 * - Delivery summary stats
 * - List of deliveries with status
 * - Link to create new delivery
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Icon,
  LoadingState,
  Table,
} from '@/shared/ui';
import {
  type Delivery,
  deliveryQueries,
  deliveryRules,
  DeliveryStatusBadge,
  downloadDeliveryStatement,
} from '@/entities/delivery';
import { quotationQueries, QuotationStatus } from '@/entities/quotation';
import { useAuth } from '@/entities/auth';
import { formatDate } from '@/shared/lib/formatting';

export interface DeliveryPanelProps {
  readonly projectId: number;
}

export function DeliveryPanel({ projectId }: DeliveryPanelProps) {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  // Check if user can create deliveries (Finance/Admin)
  const canCreateDelivery = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Fetch deliveries for this project
  const {
    data: deliveries = [],
    isLoading: loadingDeliveries,
    error: deliveriesError,
  } = useQuery(deliveryQueries.list({ projectId }));

  // Fetch approved quotation to check if deliveries can be created
  const { data: quotationsData, isLoading: loadingQuotations } = useQuery(
    quotationQueries.list({
      page: 0,
      size: 1,
      search: '',
      status: QuotationStatus.APPROVED,
      projectId,
    })
  );

  const hasApprovedQuotation = useMemo(() => {
    return quotationsData && quotationsData.data.length > 0;
  }, [quotationsData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalDeliveries = deliveries.length;
    const totalItemsDelivered = deliveries.reduce(
      (sum, d) => sum + deliveryRules.getTotalQuantity(d),
      0
    );
    const pendingCount = deliveries.filter(d => d.status === 'PENDING').length;
    const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;

    return {
      totalDeliveries,
      totalItemsDelivered,
      pendingCount,
      deliveredCount,
    };
  }, [deliveries]);

  // Track download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Handle download statement
  const handleDownloadStatement = useCallback(async (deliveryId: number) => {
    setDownloadingId(deliveryId);
    try {
      await downloadDeliveryStatement(deliveryId);
    } catch (error) {
      // Error handling could be enhanced with toast notifications
      console.error('Failed to download statement:', error);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const isLoading = loadingDeliveries || loadingQuotations;

  if (isLoading) {
    return (
      <Card>
        <LoadingState message="Loading delivery data..." />
      </Card>
    );
  }

  if (deliveriesError) {
    return (
      <Alert variant="error">
        Failed to load deliveries: {deliveriesError.message}
      </Alert>
    );
  }

  // Empty state - no approved quotation
  if (!hasApprovedQuotation) {
    return (
      <Card className="p-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">No Approved Quotation</h3>
        <p className="mt-2 text-steel-500">
          A quotation must be approved before recording deliveries.
        </p>
      </Card>
    );
  }

  // Empty state - no deliveries yet
  if (deliveries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="truck" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">No Deliveries Yet</h3>
        <p className="mt-2 text-steel-500">
          No deliveries have been recorded for this project.
        </p>
        {canCreateDelivery && (
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => navigate(`/projects/${projectId}/deliveries/create`)}
          >
            <Icon name="plus" className="h-4 w-4" />
            Record Delivery
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-steel-400">Total Deliveries</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {summary.totalDeliveries}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-steel-400">Items Delivered</div>
          <div className="mt-1 text-2xl font-bold text-copper-400">
            {summary.totalItemsDelivered}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-steel-400">Pending</div>
          <div className="mt-1 text-2xl font-bold text-yellow-500">
            {summary.pendingCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-steel-400">Delivered</div>
          <div className="mt-1 text-2xl font-bold text-green-500">
            {summary.deliveredCount}
          </div>
        </Card>
      </div>

      {/* Actions */}
      {canCreateDelivery && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/deliveries/create`)}
          >
            <Icon name="plus" className="h-4 w-4" />
            Record Delivery
          </Button>
        </div>
      )}

      {/* Deliveries Table */}
      <Card className="overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Delivery Date</Table.HeaderCell>
              <Table.HeaderCell>Delivered By</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {deliveries.map((delivery: Delivery) => (
              <Table.Row key={delivery.id}>
                <Table.Cell>
                  <Link
                    to={`/deliveries/${delivery.id}`}
                    className="font-medium text-copper-400 hover:underline"
                  >
                    #{delivery.id}
                  </Link>
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {formatDate(delivery.deliveryDate)}
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {delivery.deliveredByName}
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {delivery.lineItems.length} items ({deliveryRules.getTotalQuantity(delivery)} units)
                </Table.Cell>
                <Table.Cell>
                  <DeliveryStatusBadge status={delivery.status} />
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadStatement(delivery.id)}
                      disabled={downloadingId === delivery.id}
                      title="Download Statement PDF"
                    >
                      {downloadingId === delivery.id ? (
                        <Icon name="arrow-path" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon name="document-arrow-down" className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/deliveries/${delivery.id}`)}
                      title="View Details"
                    >
                      <Icon name="eye" className="h-4 w-4" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}
