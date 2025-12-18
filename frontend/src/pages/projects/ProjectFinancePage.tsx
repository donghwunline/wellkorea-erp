/**
 * Project Finance Page
 *
 * Manages financial records for a specific project.
 * Placeholder page - will be implemented with finance feature.
 *
 * Route: /projects/:id/finance
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, PageHeader } from '@/components/ui';

export function ProjectFinancePage() {
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
          title="정산"
          description={`Project #${id} - Finance Management`}
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
            Record Payment
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Placeholder content */}
      <Card className="mt-6">
        <div className="p-12 text-center">
          <Icon name="banknotes" className="mx-auto mb-4 h-16 w-16 text-steel-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">Finance Management</h3>
          <p className="mx-auto max-w-md text-steel-400">
            This section will track all financial transactions for this project including
            payments received, outstanding AR/AP, and financial summaries.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Payment Records
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Accounts Receivable
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Accounts Payable
            </span>
            <span className="rounded-full bg-steel-800 px-3 py-1 text-xs text-steel-400">
              Financial Summary
            </span>
          </div>
          <p className="mt-6 text-sm text-copper-500">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
