/**
 * Project Quotation Page
 *
 * Displays quotations related to a specific project.
 * Placeholder page - will be implemented with quotation feature.
 *
 * Route: /projects/:id/quotation
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, PageHeader } from '@/components/ui';

export function ProjectQuotationPage() {
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
          title="견적/결재"
          description={`Project #${id} - Quotation Management`}
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
            New Quotation
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Placeholder content */}
      <Card className="mt-6">
        <div className="p-12 text-center">
          <Icon name="document" className="mx-auto mb-4 h-16 w-16 text-steel-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">Quotation Management</h3>
          <p className="mx-auto max-w-md text-steel-400">
            This section will display and manage all quotations for this project, including
            approval workflow, document generation, and email delivery.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Approval Workflow
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              PDF Generation
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Email Delivery
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Version History
            </span>
          </div>
          <p className="mt-6 text-sm text-copper-500">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
