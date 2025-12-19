/**
 * Project Process Page
 *
 * Displays production process/progress for a specific project.
 * Placeholder page - will be implemented with production tracking feature.
 *
 * Route: /projects/:id/process
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, PageHeader } from '@/components/ui';

export function ProjectProcessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/projects/${id}`);
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header with back button */}
      <PageHeader>
        <PageHeader.Title
          title="공정/진행률"
          description={`Project #${id} - Production Process`}
        />
        <PageHeader.Actions>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Project
          </button>
          <Button>
            <Icon name="plus" className="mr-2 h-4 w-4" />
            Update Progress
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Placeholder content */}
      <Card className="mt-6">
        <div className="p-12 text-center">
          <Icon name="cog" className="mx-auto mb-4 h-16 w-16 text-steel-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">Production Process Tracking</h3>
          <p className="mx-auto max-w-md text-steel-400">
            This section will display production progress across 6 manufacturing stages: Design,
            Laser, Sheet Metal, Machining, Assembly, Welding, Painting, and Packaging.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Design
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Laser
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Sheet Metal
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Machining
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Assembly
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Welding
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Painting
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Packaging
            </span>
          </div>
          <p className="mt-6 text-sm text-copper-500">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
