/**
 * Company Detail Page
 *
 * Displays company details with all roles.
 * Allows navigation to edit page for users with edit permissions.
 *
 * FSD Layer: pages
 * - Uses useQuery directly with entity query factory
 * - Composes entity UI components
 *
 * Route: /companies/:id
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Icon, PageHeader, Spinner } from '@/shared/ui';

// Entity imports (FSD)
import { CompanyCard, companyQueries, companyRules } from '@/entities/company';

export function CompanyDetailPage() {
  const { t } = useTranslation('pages');
  const { id } = useParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  // Server State - Company detail via TanStack Query
  const {
    data: company,
    isLoading,
    error,
    refetch,
  } = useQuery(companyQueries.detail(companyId));

  const handleBack = useCallback(() => {
    navigate('/companies');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/companies/${companyId}/edit`);
  }, [navigate, companyId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyDetail.title')} description={t('companyDetail.loading')} />
          <PageHeader.Actions>
            <Button variant="ghost" onClick={handleBack}>
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('companyDetail.backToList')}
            </Button>
          </PageHeader.Actions>
        </PageHeader>
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">{t('companyDetail.loadingDetails')}</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyDetail.title')} description={t('companyDetail.error')} />
          <PageHeader.Actions>
            <Button variant="ghost" onClick={handleBack}>
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('companyDetail.backToList')}
            </Button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mb-6">
          {error?.message || t('companyDetail.notFound')}
          <Button
            variant="secondary"
            size="sm"
            className="ml-4"
            onClick={() => void refetch()}
          >
            {t('companyDetail.retry')}
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={company.name}
          description={company.registrationNumber || t('companyDetail.noRegistrationNumber')}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={handleBack}>
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('companyDetail.backToList')}
          </Button>
          {companyRules.canEdit(company) && (
            <Button onClick={handleEdit}>
              <Icon name="pencil" className="h-5 w-5" />
              {t('companyDetail.edit')}
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* Company Details (dumb component) */}
      <CompanyCard company={company} />
    </div>
  );
}
