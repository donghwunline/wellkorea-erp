/**
 * Work Progress Sheet Table.
 *
 * Pure display component for work progress sheet list.
 * Receives data and callbacks via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import type { ReactNode } from 'react';
import { Card, EmptyState, Table } from '@/shared/ui';
import type { WorkProgressSheetListItem } from '../model/work-progress-sheet';
import { SheetStatusBadge } from './SheetStatusBadge';
import { WorkProgressBar } from './WorkProgressBar';

export interface WorkProgressSheetTableProps {
  /**
   * Work progress sheets to display (list items).
   */
  sheets: readonly WorkProgressSheetListItem[];

  /**
   * Called when a row is clicked.
   */
  onRowClick?: (sheet: WorkProgressSheetListItem) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (sheet: WorkProgressSheetListItem) => ReactNode;

  /**
   * Empty state message when no sheets.
   */
  emptyMessage?: string;

  /**
   * Whether to show project info (jobCode).
   * @default false
   */
  showProject?: boolean;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Table component for displaying work progress sheets.
 *
 * This is a pure display component that:
 * - Renders sheet data in table format
 * - Delegates row clicks via callback
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function ProductionListPage() {
 *   const { data } = useQuery(workProgressQueries.list(projectId));
 *   const navigate = useNavigate();
 *
 *   return (
 *     <WorkProgressSheetTable
 *       sheets={data ?? []}
 *       onRowClick={(s) => navigate(`/production/${s.id}`)}
 *       renderActions={(s) => (
 *         <ViewButton sheetId={s.id} />
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function WorkProgressSheetTable({
  sheets,
  onRowClick,
  renderActions,
  emptyMessage = '등록된 작업지가 없습니다.',
  showProject = false,
  className,
}: Readonly<WorkProgressSheetTableProps>) {
  const columnCount = (showProject ? 1 : 0) + 5 + (renderActions ? 1 : 0);

  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            {showProject && <Table.HeaderCell>Job Code</Table.HeaderCell>}
            <Table.HeaderCell>순번</Table.HeaderCell>
            <Table.HeaderCell>제품</Table.HeaderCell>
            <Table.HeaderCell className="text-center">수량</Table.HeaderCell>
            <Table.HeaderCell>진행률</Table.HeaderCell>
            <Table.HeaderCell>상태</Table.HeaderCell>
            {renderActions && <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sheets.length === 0 ? (
            <EmptyState
              variant="table"
              colspan={columnCount}
              message={emptyMessage}
            />
          ) : (
            sheets.map(sheet => (
              <Table.Row
                key={sheet.id}
                onClick={onRowClick ? () => onRowClick(sheet) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : undefined}
              >
                {showProject && (
                  <Table.Cell className="font-mono text-sm text-steel-300">
                    {sheet.jobCode}
                  </Table.Cell>
                )}
                <Table.Cell className="text-center text-steel-300">
                  {sheet.sequence}
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium text-white">{sheet.productName}</div>
                  <div className="text-sm text-steel-400">{sheet.productSku}</div>
                </Table.Cell>
                <Table.Cell className="text-center text-steel-300">
                  {sheet.quantity}
                </Table.Cell>
                <Table.Cell className="min-w-[200px]">
                  <WorkProgressBar sheet={sheet} size="sm" />
                </Table.Cell>
                <Table.Cell>
                  <SheetStatusBadge status={sheet.status} size="sm" />
                </Table.Cell>
                {renderActions && (
                  <Table.Cell>
                    <div
                      className="flex justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {renderActions(sheet)}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Card>
  );
}
