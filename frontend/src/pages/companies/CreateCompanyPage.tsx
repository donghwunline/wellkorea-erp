/**
 * Create Company Page
 *
 * Page for creating new companies with role selection.
 * Shows success message after creation and navigates to company detail.
 *
 * FSD Layer: pages
 * - Uses feature hooks for mutations
 * - Composes feature UI components
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Icon, PageHeader } from '@/shared/ui';

// Feature imports (FSD)
import {
  useCreateCompany,
  CompanyForm,
  type CompanyFormData,
} from '@/features/company';

// Entity imports (FSD)
import type { CreateCompanyInput } from '@/entities/company';

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutation hook from features layer
  const { mutateAsync: createCompany, isPending } = useCreateCompany({
    onSuccess: result => {
      setSuccessMessage('Company created successfully!');
      // Navigate to the new company detail page after short delay
      setTimeout(() => {
        navigate(`/companies/${result.id}`);
      }, 1500);
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleSubmit = useCallback(async (data: CompanyFormData) => {
    setError(null);

    // Map form data to command input
    const input: CreateCompanyInput = {
      name: data.name.trim(),
      roles: data.roles,
      registrationNumber: data.registrationNumber.trim() || undefined,
      representative: data.representative.trim() || undefined,
      businessType: data.businessType.trim() || undefined,
      businessCategory: data.businessCategory.trim() || undefined,
      contactPerson: data.contactPerson.trim() || undefined,
      phone: data.phone.trim() || undefined,
      email: data.email.trim() || undefined,
      address: data.address.trim() || undefined,
      bankAccount: data.bankAccount.trim() || undefined,
      paymentTerms: data.paymentTerms.trim() || undefined,
    };

    await createCompany(input);
  }, [createCompany]);

  const handleCancel = useCallback(() => {
    navigate('/companies');
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
            isSubmitting={isPending}
            error={error}
            onDismissError={clearError}
          />
        </div>
      </Card>
    </div>
  );
}
