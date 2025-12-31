/**
 * Company Detail Page
 *
 * Displays company details with all roles.
 * Allows navigation to edit page for users with edit permissions.
 *
 * Route: /companies/:id
 */

import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Icon, PageHeader } from '@/shared/ui';
import { CompanyDetailsCard } from '@/components/features/companies';
import type { CompanyDetails } from '@/services';

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/companies');
  };

  const handleEdit = () => {
    navigate(`/companies/${companyId}/edit`);
  };

  const handleCompanyLoad = useCallback((loadedCompany: CompanyDetails) => {
    setCompany(loadedCompany);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={company?.name || 'Company Details'}
          description={company?.registrationNumber || 'Loading...'}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={handleBack}>
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to List
          </Button>
          <Button onClick={handleEdit}>
            <Icon name="pencil" className="h-5 w-5" />
            Edit
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Company Details */}
      <CompanyDetailsCard companyId={companyId} onLoad={handleCompanyLoad} onError={handleError} />
    </div>
  );
}
