/**
 * Create Company Page
 *
 * Page for creating new companies with role selection.
 * Shows success message after creation and navigates to company detail.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateCompanyRequest, UpdateCompanyRequest } from '@/services';
import { Alert, Card, Icon, PageHeader } from '@/components/ui';
import { CompanyForm, useCompanyActions } from '@/components/features/companies';

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const { createCompany, isLoading, error, clearError } = useCompanyActions();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    try {
      // In create mode, the form always provides CreateCompanyRequest
      const result = await createCompany(data as CreateCompanyRequest);
      setSuccessMessage(`Company created successfully!`);
      // Navigate to the new company detail page after short delay
      setTimeout(() => {
        navigate(`/companies/${result.id}`);
      }, 1500);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleCancel = () => {
    navigate('/companies');
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Create New Company"
          description="Add a new company with customer, vendor, or outsource roles"
        />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Companies
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6">
          {successMessage}
        </Alert>
      )}

      {/* Form Card */}
      <Card className="mx-auto max-w-3xl">
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Company Details</h2>
          <CompanyForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isLoading}
            error={error}
            onDismissError={clearError}
          />
        </div>
      </Card>
    </div>
  );
}
