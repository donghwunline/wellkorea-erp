/**
 * Project Related Navigation Grid
 *
 * Displays summary cards for all project sections with navigation.
 * Smart component - fetches data and handles role-based visibility.
 */

import { useAuth } from '@/entities/auth';
import { Alert, Button, Card, Icon, Spinner } from '@/shared/ui';
import type { RoleName } from '@/entities/user';
import type { ProjectSection } from '@/entities/project';
import { useProjectSummary } from './hooks';
import { ProjectSummaryCard } from './ProjectSummaryCard';

export interface ProjectRelatedNavigationGridProps {
  /** Project ID to display sections for */
  projectId: number;
  /** Optional callback when a section card is clicked (instead of navigation) */
  onSectionClick?: (section: ProjectSection) => void;
}

/**
 * Role requirements for each section.
 * Sections not listed are accessible to all authenticated users.
 */
const SECTION_ROLE_REQUIREMENTS: Partial<Record<ProjectSection, RoleName[]>> = {
  quotation: ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES'],
  finance: ['ROLE_ADMIN', 'ROLE_FINANCE'],
};

/**
 * Navigation grid showing summary cards for project sections.
 * Filters cards based on user role permissions.
 */
export function ProjectRelatedNavigationGrid({
  projectId,
  onSectionClick,
}: Readonly<ProjectRelatedNavigationGridProps>) {
  const { hasAnyRole } = useAuth();
  const { summary, isLoading, error, refetch } = useProjectSummary({ projectId });

  // Filter sections based on user roles
  const visibleSections = summary?.sections.filter(section => {
    const requiredRoles = SECTION_ROLE_REQUIREMENTS[section.section];
    // If no role requirement, visible to all
    if (!requiredRoles) return true;
    // Check if user has any of the required roles
    return hasAnyRole(requiredRoles);
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" label="Loading project summary" />
        <span className="ml-3 text-steel-400">Loading project summary...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  // Empty state (no sections visible - unlikely but handle gracefully)
  if (!visibleSections || visibleSections.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="clipboard" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="mb-2 text-lg font-semibold text-white">No sections available</h3>
        <p className="text-steel-500">
          This project doesn&apos;t have any sections yet, or you don&apos;t have permission
          to view them.
        </p>
      </Card>
    );
  }

  // Grid display
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleSections.map(section => (
        <ProjectSummaryCard
          key={section.section}
          projectId={projectId}
          summary={section}
          onSectionClick={onSectionClick}
        />
      ))}
    </div>
  );
}
