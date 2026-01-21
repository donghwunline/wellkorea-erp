/**
 * AR Report Page
 *
 * Displays accounts receivable aging report with summary, customer breakdown,
 * and invoice list.
 *
 * Route: /reports/ar
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/invoice for AR report query
 * - Uses widgets/ar-report for visual components
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Icon, LoadingState, PageHeader, Button } from '@/shared/ui';
import { arReportQueries } from '@/entities/invoice';
import { ARAgingSummary, ARCustomerTable, ARInvoiceList } from '@/widgets/ar-report';
import { useAuth } from '@/entities/auth';

export function ARReportPage() {
  const { t } = useTranslation('pages');
  const { hasAnyRole } = useAuth();

  // Check permissions
  const canViewReport = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Fetch AR report
  const {
    data: report,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery(arReportQueries.report());

  if (!canViewReport) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          {t('arReport.noPermission')}
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message={t('arReport.loading')} />
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('arReport.loadError')}: {fetchError.message}</Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('arReport.noData')}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={t('arReport.title')}
          description={t('arReport.description')}
        />
        <PageHeader.Actions>
          <Button variant="secondary" onClick={() => refetch()}>
            <Icon name="arrow-path" className="mr-2 h-4 w-4" />
            {t('arReport.refresh')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Aging Summary */}
      <div className="mb-6">
        <ARAgingSummary report={report} />
      </div>

      {/* Two-column layout for customer and invoice list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer breakdown (1/3) */}
        <div className="lg:col-span-1">
          <ARCustomerTable customers={report.byCustomer} />
        </div>

        {/* Invoice list (2/3) */}
        <div className="lg:col-span-2">
          <ARInvoiceList invoices={report.invoices} />
        </div>
      </div>
    </div>
  );
}
