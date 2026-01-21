/**
 * Project Table.
 *
 * Pure display component for project list.
 * Receives data and callbacks via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import { useTranslation } from 'react-i18next';
import { Card, EmptyState, Table, Badge, type BadgeVariant } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatting';
import type { ProjectListItem, ProjectStatus } from '../model/project';

// Status badge variant mapping
const STATUS_BADGE_VARIANTS: Record<ProjectStatus, BadgeVariant> = {
  DRAFT: 'warning',
  ACTIVE: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'purple',
};

export interface ProjectTableProps {
  /**
   * Projects to display (list items, not full project details).
   */
  projects: readonly ProjectListItem[];

  /**
   * Called when a row is clicked.
   */
  onRowClick?: (project: ProjectListItem) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (project: ProjectListItem) => React.ReactNode;

  /**
   * Empty state message when no projects.
   */
  emptyMessage?: string;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Table component for displaying project list.
 *
 * This is a pure display component that:
 * - Renders project data in table format
 * - Delegates row clicks via callback
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function ProjectListPage() {
 *   const { data } = useQuery(projectQueries.list({ page: 0, size: 10, search: '', status: null }));
 *   const navigate = useNavigate();
 *
 *   return (
 *     <ProjectTable
 *       projects={data?.data ?? []}
 *       onRowClick={(p) => navigate(`/projects/${p.id}`)}
 *       renderActions={(p) => (
 *         <IconButton onClick={() => navigate(`/projects/${p.id}`)}>
 *           <Icon name="eye" />
 *         </IconButton>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function ProjectTable({
  projects,
  onRowClick,
  renderActions,
  emptyMessage,
  className,
}: Readonly<ProjectTableProps>) {
  const { t } = useTranslation('projects');
  const resolvedEmptyMessage = emptyMessage ?? t('list.empty');

  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('table.headers.jobCode')}</Table.HeaderCell>
            <Table.HeaderCell>{t('table.headers.projectName')}</Table.HeaderCell>
            <Table.HeaderCell>{t('fields.contact')}</Table.HeaderCell>
            <Table.HeaderCell>{t('table.headers.dueDate')}</Table.HeaderCell>
            <Table.HeaderCell>{t('table.headers.status')}</Table.HeaderCell>
            {renderActions && <Table.HeaderCell className="text-right">{t('table.headers.actions')}</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {projects.length === 0 ? (
            <EmptyState variant="table" colspan={renderActions ? 6 : 5} message={resolvedEmptyMessage} />
          ) : (
            projects.map(project => (
              <Table.Row
                key={project.id}
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : undefined}
              >
                <Table.Cell>
                  <span className="font-mono text-sm font-medium text-copper-400">
                    {project.jobCode}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium text-white">{project.projectName}</div>
                </Table.Cell>
                <Table.Cell className="text-steel-400">
                  {project.requesterName || '-'}
                </Table.Cell>
                <Table.Cell className="text-steel-400">{formatDate(project.dueDate)}</Table.Cell>
                <Table.Cell>
                  <Badge variant={STATUS_BADGE_VARIANTS[project.status]}>
                    {t(`status.${project.status}`)}
                  </Badge>
                </Table.Cell>
                {renderActions && (
                  <Table.Cell>
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {renderActions(project)}
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
