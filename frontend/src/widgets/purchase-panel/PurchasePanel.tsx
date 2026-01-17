/**
 * Purchase Panel Widget
 *
 * Displays material purchasing information for a project including:
 * - Purchase request summary stats (for physical materials)
 * - List of purchase requests with status
 * - Link to create new purchase request (future)
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, Icon, LoadingState, Table } from '@/shared/ui';
import {
  type PurchaseRequestListItem,
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
} from '@/entities/purchase-request';
import { formatDate } from '@/shared/lib/formatting';

export interface PurchasePanelProps {
  readonly projectId: number;
}

/**
 * Summary stats for material purchase requests
 */
function MaterialPurchaseRequestSummaryStats({
  requests,
}: {
  readonly requests: readonly PurchaseRequestListItem[];
}) {
  const stats = useMemo(() => {
    const total = requests.length;
    const draft = requests.filter(r => r.status === PurchaseRequestStatus.DRAFT).length;
    const rfqSent = requests.filter(r => r.status === PurchaseRequestStatus.RFQ_SENT).length;
    const vendorSelected = requests.filter(
      r => r.status === PurchaseRequestStatus.VENDOR_SELECTED
    ).length;
    const closed = requests.filter(r => r.status === PurchaseRequestStatus.CLOSED).length;

    return { total, draft, rfqSent, vendorSelected, closed };
  }, [requests]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <Card className="p-4">
        <div className="text-sm text-steel-400">전체</div>
        <div className="mt-1 text-2xl font-bold text-white">{stats.total}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">초안</div>
        <div className="mt-1 text-2xl font-bold text-steel-300">{stats.draft}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">RFQ 발송</div>
        <div className="mt-1 text-2xl font-bold text-blue-400">{stats.rfqSent}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">업체 선정</div>
        <div className="mt-1 text-2xl font-bold text-orange-400">{stats.vendorSelected}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">완료</div>
        <div className="mt-1 text-2xl font-bold text-green-400">{stats.closed}</div>
      </Card>
    </div>
  );
}

/**
 * Status badge for purchase request
 */
function PurchaseRequestStatusBadge({
  status,
  isOverdue,
}: {
  readonly status: PurchaseRequestStatus;
  readonly isOverdue: boolean;
}) {
  const config = PurchaseRequestStatusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={config.color} dot>
        {config.labelKo}
      </Badge>
      {isOverdue && (
        <span
          className="inline-flex items-center rounded-full bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400"
          title="납기일 초과"
        >
          <Icon name="warning" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

export function PurchasePanel({ projectId }: PurchasePanelProps) {
  // Fetch material purchase requests for this project (dtype = MATERIAL)
  const {
    data: purchaseRequestsData,
    isLoading,
    error,
  } = useQuery(
    purchaseRequestQueries.list({
      page: 0,
      size: 100,
      status: null,
      projectId,
      dtype: 'MATERIAL',
    })
  );

  const purchaseRequests = purchaseRequestsData?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <LoadingState message="Loading material purchase requests..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load material purchase requests: {error.message}
      </Alert>
    );
  }

  // Empty state - no purchase requests yet
  if (purchaseRequests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="shopping-cart" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">자재 구매 요청 없음</h3>
        <p className="mt-2 text-steel-500">
          이 프로젝트에 대한 자재 구매 요청이 아직 없습니다.
        </p>
        <p className="mt-1 text-sm text-steel-600">
          (나사, 볼트, 공구 등 소모품 구매)
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <MaterialPurchaseRequestSummaryStats requests={purchaseRequests} />

      {/* Purchase Requests Table */}
      <Card className="overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>요청번호</Table.HeaderCell>
              <Table.HeaderCell>자재명</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell>내용</Table.HeaderCell>
              <Table.HeaderCell>수량</Table.HeaderCell>
              <Table.HeaderCell>납기일</Table.HeaderCell>
              <Table.HeaderCell>상태</Table.HeaderCell>
              <Table.HeaderCell>요청자</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {purchaseRequests.map((request: PurchaseRequestListItem) => {
              const isOverdue = purchaseRequestRules.isOverdue(request);

              return (
                <Table.Row
                  key={request.id}
                  className="cursor-pointer transition-colors hover:bg-steel-800/50"
                >
                  <Table.Cell>
                    <span className="font-medium text-copper-400">
                      {request.requestNumber}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.materialName ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm text-steel-400">
                    {request.materialSku ?? '-'}
                  </Table.Cell>
                  <Table.Cell className="max-w-xs truncate text-steel-300">
                    {request.description}
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.quantity} {request.uom}
                  </Table.Cell>
                  <Table.Cell className={isOverdue ? 'text-red-400' : 'text-steel-300'}>
                    {formatDate(request.requiredDate)}
                  </Table.Cell>
                  <Table.Cell>
                    <PurchaseRequestStatusBadge status={request.status} isOverdue={isOverdue} />
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.createdByName}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}
