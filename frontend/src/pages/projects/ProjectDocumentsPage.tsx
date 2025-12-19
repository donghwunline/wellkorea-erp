/**
 * Project Documents Page
 *
 * Manages documents and drawings for a specific project.
 * Placeholder page - will be implemented with document management feature.
 *
 * Route: /projects/:id/documents
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, PageHeader } from '@/components/ui';

export function ProjectDocumentsPage() {
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
          title="도면/문서"
          description={`Project #${id} - Document Management`}
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
            Upload Document
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Placeholder content */}
      <Card className="mt-6">
        <div className="p-12 text-center">
          <Icon name="folder" className="mx-auto mb-4 h-16 w-16 text-steel-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">Document Management</h3>
          <p className="mx-auto max-w-md text-steel-400">
            This section will manage all project documents including drawings, specifications,
            and attachments with version control and access permissions.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              CAD Drawings
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Specifications
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Version Control
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Access Control
            </span>
          </div>
          <p className="mt-6 text-sm text-copper-500">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
