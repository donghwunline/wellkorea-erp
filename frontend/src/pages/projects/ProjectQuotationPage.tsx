/**
 * Project Quotation Page
 *
 * Displays quotations related to a specific project.
 * Shows all versions and allows creating new quotations.
 *
 * Route: /projects/:id/quotation
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Modal open/close -> Local state
 * - Tier 2 (Page UI State): Pagination -> Local state (no search for project-scoped)
 * - Tier 3 (Server State): Quotation list data -> QuotationTable feature component
 * - Tier 4 (App Global State): Not used directly here
 */

import { useCallback, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, ConfirmationModal, Icon, PageHeader } from '@/components/ui';
import {
  QuotationTable,
  useQuotationActions,
} from '@/components/features/quotations';
import type { QuotationDetails } from '@/services';

export function ProjectQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : undefined;
  const navigate = useNavigate();

  // Page state
  const [page, setPage] = useState(0);
  const [refreshTrigger, triggerRefresh] = useReducer((x: number) => x + 1, 0);

  // Local UI State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState<QuotationDetails | null>(null);
  const [versionConfirm, setVersionConfirm] = useState<QuotationDetails | null>(null);

  // Actions hook
  const { submitForApproval, createNewVersion, downloadPdf } = useQuotationActions();

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleBack = () => {
    navigate(`/projects/${id}`);
  };

  // Handle view quotation
  const handleView = useCallback(
    (quotation: QuotationDetails) => {
      navigate(`/projects/${id}/quotations/${quotation.id}`);
    },
    [navigate, id]
  );

  // Handle edit quotation
  const handleEdit = useCallback(
    (quotation: QuotationDetails) => {
      navigate(`/projects/${id}/quotations/${quotation.id}/edit`);
    },
    [navigate, id]
  );

  // Handle submit for approval
  const handleSubmit = useCallback((quotation: QuotationDetails) => {
    setSubmitConfirm(quotation);
  }, []);

  const handleSubmitConfirm = useCallback(async () => {
    if (!submitConfirm) return;

    try {
      await submitForApproval(submitConfirm.id);
      showSuccess(`Quotation ${submitConfirm.jobCode} submitted for approval`);
      triggerRefresh();
    } catch {
      setError('Failed to submit quotation for approval');
    } finally {
      setSubmitConfirm(null);
    }
  }, [submitConfirm, submitForApproval, showSuccess]);

  // Handle create new version
  const handleCreateVersion = useCallback((quotation: QuotationDetails) => {
    setVersionConfirm(quotation);
  }, []);

  const handleVersionConfirm = useCallback(async () => {
    if (!versionConfirm) return;

    try {
      const newVersion = await createNewVersion(versionConfirm.id);
      showSuccess(`New version v${newVersion.version} created`);
      triggerRefresh();
      // Navigate to edit the new version
      navigate(`/projects/${id}/quotations/${newVersion.id}/edit`);
    } catch {
      setError('Failed to create new version');
    } finally {
      setVersionConfirm(null);
    }
  }, [versionConfirm, createNewVersion, showSuccess, navigate, id]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(async (quotation: QuotationDetails) => {
    try {
      await downloadPdf(quotation.id, `${quotation.jobCode}_v${quotation.version}.pdf`);
    } catch {
      setError('Failed to download PDF');
    }
  }, [downloadPdf]);

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
          <Button onClick={() => navigate(`/projects/${id}/quotations/create`)}>
            <Icon name="plus" className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quotations Table (filtered by project) */}
      <QuotationTable
        page={page}
        projectId={projectId}
        refreshTrigger={refreshTrigger}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onCreateVersion={handleCreateVersion}
        onDownloadPdf={handleDownloadPdf}
        onError={setError}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${submitConfirm?.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(null)}
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!versionConfirm}
        title="Create New Version"
        message={`Create a new version based on "${versionConfirm?.jobCode} v${versionConfirm?.version}"? The new version will be in DRAFT status.`}
        confirmLabel="Create Version"
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(null)}
      />
    </div>
  );
}
