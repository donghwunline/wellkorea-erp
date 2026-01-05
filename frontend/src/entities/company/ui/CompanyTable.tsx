/**
 * Company Table.
 *
 * Pure display component for company list.
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
import type { CompanyListItem } from '../model/company';
import { formatDate } from '@/shared/lib/formatting/date';
import { CompanyRoleBadge } from './CompanyRoleBadge';

export interface CompanyTableProps {
  /**
   * Companies to display (list items, not full company details).
   */
  companies: readonly CompanyListItem[];

  /**
   * Called when a row is clicked.
   */
  onRowClick?: (company: CompanyListItem) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (company: CompanyListItem) => ReactNode;

  /**
   * Empty state message when no companies.
   */
  emptyMessage?: string;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Table component for displaying company list.
 *
 * This is a pure display component that:
 * - Renders company data in table format
 * - Delegates row clicks via callback
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function CompanyListPage() {
 *   const { data } = useQuery(companyQueries.list({ page: 0, size: 10, search: '', roleType: null }));
 *   const navigate = useNavigate();
 *
 *   return (
 *     <CompanyTable
 *       companies={data?.data ?? []}
 *       onRowClick={(c) => navigate(`/companies/${c.id}`)}
 *       renderActions={(c) => (
 *         <>
 *           <ViewButton companyId={c.id} />
 *           {companyRules.canEdit(c) && <EditButton companyId={c.id} />}
 *         </>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function CompanyTable({
  companies,
  onRowClick,
  renderActions,
  emptyMessage = 'No companies found.',
  className,
}: Readonly<CompanyTableProps>) {
  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Company Name</Table.HeaderCell>
            <Table.HeaderCell>Registration No.</Table.HeaderCell>
            <Table.HeaderCell>Contact</Table.HeaderCell>
            <Table.HeaderCell>Roles</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            {renderActions && <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {companies.length === 0 ? (
            <EmptyState
              variant="table"
              colspan={renderActions ? 6 : 5}
              message={emptyMessage}
            />
          ) : (
            companies.map(company => (
              <Table.Row
                key={company.id}
                onClick={onRowClick ? () => onRowClick(company) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : undefined}
              >
                <Table.Cell>
                  <div className="font-medium text-white">{company.name}</div>
                  {company.email && (
                    <div className="text-sm text-steel-400">{company.email}</div>
                  )}
                </Table.Cell>
                <Table.Cell className="font-mono text-sm text-steel-400">
                  {company.registrationNumber || '-'}
                </Table.Cell>
                <Table.Cell>
                  <div className="text-steel-300">{company.contactPerson || '-'}</div>
                  {company.phone && (
                    <div className="text-sm text-steel-400">{company.phone}</div>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {company.roles.map(role => (
                      <CompanyRoleBadge
                        key={role.id}
                        roleType={role.roleType}
                        size="sm"
                      />
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell className="text-steel-400">
                  {formatDate(company.createdAt)}
                </Table.Cell>
                {renderActions && (
                  <Table.Cell>
                    <div
                      className="flex justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {renderActions(company)}
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
