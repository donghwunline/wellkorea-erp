/**
 * Project Details Card
 *
 * Displays project information in a read-only card format.
 * Used in the project view page.
 */

import type { ProjectDetails, ProjectStatus } from '@/services';
import { PROJECT_STATUS_LABELS } from '@/services';
import { Badge, type BadgeVariant, Card, Icon, IconButton } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils';

// Status badge variant mapping
const STATUS_BADGE_VARIANTS: Record<ProjectStatus, BadgeVariant> = {
  DRAFT: 'warning',
  ACTIVE: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'purple',
};

export interface ProjectDetailsCardProps {
  /** Project data */
  project: ProjectDetails;
  /** Customer name (resolved from ID) */
  customerName?: string;
  /** Internal owner name (resolved from ID) */
  internalOwnerName?: string;
  /** Created by user name (resolved from ID) */
  createdByName?: string;
  /** Callback when edit action is clicked */
  onEdit?: () => void;
}

/**
 * Read-only card displaying project details.
 */
export function ProjectDetailsCard({
  project,
  customerName,
  internalOwnerName,
  createdByName,
  onEdit,
}: Readonly<ProjectDetailsCardProps>) {
  return (
    <Card>
      <div className="relative p-6">
        {/* Edit Action (top-right corner) */}
        {onEdit && (
          <div className="absolute right-4 top-4">
            <IconButton
              variant="primary"
              onClick={onEdit}
              aria-label="Edit project"
              title="Edit project"
            >
              <Icon name="pencil" className="h-4 w-4" />
            </IconButton>
          </div>
        )}

        {/* Header with JobCode and Status */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-copper-400">
                {project.jobCode}
              </span>
              <Badge variant={STATUS_BADGE_VARIANTS[project.status]}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold text-white">{project.projectName}</h2>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Customer */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="users" className="h-4 w-4" />
              Customer
            </div>
            <p className="text-white">
              {customerName || `Customer #${project.customerId}`}
            </p>
          </div>

          {/* Requester */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="user" className="h-4 w-4" />
              Requester
            </div>
            <p className="text-white">{project.requesterName || '-'}</p>
          </div>

          {/* Due Date */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="calendar" className="h-4 w-4" />
              Due Date
            </div>
            <p className="text-white">{formatDate(project.dueDate)}</p>
          </div>

          {/* Internal Owner */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="user" className="h-4 w-4" />
              Internal Owner
            </div>
            <p className="text-white">
              {internalOwnerName || `User #${project.internalOwnerId}`}
            </p>
          </div>

          {/* Created By */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="user" className="h-4 w-4" />
              Created By
            </div>
            <p className="text-white">
              {createdByName || `User #${project.createdById}`}
            </p>
          </div>

          {/* Created At */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="clock" className="h-4 w-4" />
              Created At
            </div>
            <p className="text-white">{formatDateTime(project.createdAt)}</p>
          </div>

          {/* Last Updated */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-steel-500">
              <Icon name="clock" className="h-4 w-4" />
              Last Updated
            </div>
            <p className="text-white">{formatDateTime(project.updatedAt)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
