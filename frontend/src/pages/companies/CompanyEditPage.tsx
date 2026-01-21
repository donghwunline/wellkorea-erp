/**
 * Company Edit Page
 *
 * Page for editing existing companies including:
 * - Company information form
 * - Role management (add/remove roles)
 *
 * FSD Layer: pages
 * - Uses feature hooks for mutations
 * - Composes feature UI components
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Icon, PageHeader, Spinner } from '@/shared/ui';

// Feature imports (FSD)
import { useUpdateCompany } from '@/features/company/update';
import { useAddRole } from '@/features/company/add-role';
import { useRemoveRole } from '@/features/company/remove-role';
import { CompanyForm, type CompanyFormData } from '@/features/company/form';

// Entity imports (FSD)
import {
  companyQueries,
  companyRules,
  ROLE_TYPE_LABELS,
  type RoleType,
  type UpdateCompanyInput,
} from '@/entities/company';

// =============================================================================
// ROLE MANAGEMENT SECTION COMPONENT
// =============================================================================

interface RoleManagementSectionProps {
  companyId: number;
  roles: readonly { roleType: RoleType }[];
  isDisabled: boolean;
}

function RoleManagementSection({
  companyId,
  roles,
  isDisabled,
}: Readonly<RoleManagementSectionProps>) {
  const { t } = useTranslation('pages');
  const [addRoleError, setAddRoleError] = useState<string | null>(null);
  const [removeRoleError, setRemoveRoleError] = useState<string | null>(null);

  // Add role mutation
  const { mutate: addRole, isPending: isAddingRole } = useAddRole({
    onSuccess: () => setAddRoleError(null),
    onError: err => setAddRoleError(err.message),
  });

  // Remove role mutation
  const { mutate: removeRole, isPending: isRemovingRole } = useRemoveRole({
    onSuccess: () => setRemoveRoleError(null),
    onError: err => setRemoveRoleError(err.message),
  });

  const isBusy = isAddingRole || isRemovingRole || isDisabled;

  // Get roles that can be added (not already assigned)
  const existingRoleTypes = roles.map(r => r.roleType);
  const availableRoles = (['CUSTOMER', 'VENDOR', 'OUTSOURCE'] as RoleType[]).filter(
    rt => !existingRoleTypes.includes(rt)
  );

  // Can only remove role if company has more than 1 role
  const canRemoveRole = roles.length > 1;

  const handleAddRole = (roleType: RoleType) => {
    setAddRoleError(null);
    addRole({ companyId, roleType });
  };

  const handleRemoveRole = (roleType: RoleType) => {
    setRemoveRoleError(null);
    removeRole({ companyId, roleType });
  };

  return (
    <div className="space-y-4">
      <h3 className="border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
        {t('companyEdit.companyRoles')}
      </h3>

      {/* Error messages */}
      {addRoleError && (
        <Alert variant="error" className="text-sm">
          {addRoleError}
        </Alert>
      )}
      {removeRoleError && (
        <Alert variant="error" className="text-sm">
          {removeRoleError}
        </Alert>
      )}

      {/* Current roles */}
      <div className="space-y-2">
        <p className="text-xs text-steel-500">{t('companyEdit.currentRoles')}</p>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <div
              key={role.roleType}
              className="flex items-center gap-2 rounded-lg bg-steel-800 px-3 py-2"
            >
              <span className="text-sm text-steel-200">{ROLE_TYPE_LABELS[role.roleType]}</span>
              {canRemoveRole && (
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role.roleType)}
                  disabled={isBusy}
                  className="rounded p-0.5 text-steel-400 transition-colors hover:bg-steel-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title={t('companyEdit.removeRole')}
                >
                  <Icon name="x-mark" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {!canRemoveRole && (
          <p className="text-xs text-steel-500">
            {t('companyEdit.cannotRemoveLastRole')}
          </p>
        )}
      </div>

      {/* Add new role */}
      {availableRoles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-steel-500">{t('companyEdit.addNewRole')}</p>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map(roleType => (
              <Button
                key={roleType}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddRole(roleType)}
                disabled={isBusy}
                isLoading={isAddingRole}
              >
                <Icon name="plus" className="mr-1 h-4 w-4" />
                {ROLE_TYPE_LABELS[roleType]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {availableRoles.length === 0 && (
        <p className="text-xs text-steel-500">
          {t('companyEdit.allRolesAssigned')}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export function CompanyEditPage() {
  const { t } = useTranslation('pages');
  const { id } = useParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  // Local state
  const [error, setError] = useState<string | null>(null);

  // Fetch company using Query Factory
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: fetchError,
  } = useQuery({
    ...companyQueries.detail(companyId),
    enabled: companyId > 0,
  });

  // Update mutation
  const { mutateAsync: updateCompany, isPending: isUpdating } = useUpdateCompany({
    onSuccess: () => {
      navigate(`/companies/${companyId}`);
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleSubmit = useCallback(
    async (data: CompanyFormData) => {
      setError(null);

      // Map form data to command input (excluding roles - handled separately)
      const input: UpdateCompanyInput = {
        id: companyId,
        name: data.name.trim(),
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

      await updateCompany(input);
    },
    [companyId, updateCompany]
  );

  const handleCancel = useCallback(() => {
    navigate(`/companies/${companyId}`);
  }, [navigate, companyId]);

  const handleBack = useCallback(() => {
    navigate('/companies');
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Loading state
  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyEdit.loading')} />
        </PageHeader>
        <Card className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" label={t('companyEdit.loadingCompany')} />
            <span className="ml-3 text-steel-400">{t('companyEdit.loadingDetails')}</span>
          </div>
        </Card>
      </div>
    );
  }

  // Load error state
  if (fetchError && !company) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyEdit.error')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('companyEdit.backToCompanies')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mx-auto max-w-3xl">
          {fetchError instanceof Error ? fetchError.message : t('companyEdit.loadError')}
        </Alert>
      </div>
    );
  }

  // Not found state
  if (!company) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyEdit.notFound')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('companyEdit.backToCompanies')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="warning" className="mx-auto max-w-3xl">
          {t('companyEdit.notFoundMessage')}
        </Alert>
      </div>
    );
  }

  // Cannot edit state
  if (!companyRules.canEdit(company)) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('companyEdit.cannotEdit')} />
          <PageHeader.Actions>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('companyEdit.backToCompany')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="warning" className="mx-auto max-w-3xl">
          {t('companyEdit.cannotEditInactive')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('companyEdit.title')} description={company.name} />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('companyEdit.backToCompany')}
          </button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Company Info Form */}
        <Card>
          <div className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">{t('companyEdit.companyDetails')}</h2>
            <CompanyForm
              mode="edit"
              initialData={company}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isUpdating}
              error={error}
              onDismissError={clearError}
            />
          </div>
        </Card>

        {/* Role Management Section */}
        <Card>
          <div className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">{t('companyEdit.roleManagement')}</h2>
            <RoleManagementSection
              companyId={companyId}
              roles={company.roles}
              isDisabled={isUpdating}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
