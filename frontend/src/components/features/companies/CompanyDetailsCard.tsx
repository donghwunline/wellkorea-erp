/**
 * Company Details Card - Smart Feature Component
 *
 * Displays company details including contact info and roles.
 * Fetches company data from companyService.
 */

import { useCallback, useEffect, useState } from 'react';
import { companyService, ROLE_TYPE_LABELS } from '@/services';
import type { CompanyDetails, RoleType } from '@/services';
import { formatDate } from '@/shared/utils';
import {
  Badge,
  type BadgeVariant,
  Card,
  Spinner,
} from '@/components/ui';

// Role type badge variant mapping
const ROLE_BADGE_VARIANTS: Record<RoleType, BadgeVariant> = {
  CUSTOMER: 'info',
  VENDOR: 'success',
  OUTSOURCE: 'purple',
};

export interface CompanyDetailsCardProps {
  /** Company ID to fetch */
  companyId: number;
  /** Called when company data is loaded */
  onLoad?: (company: CompanyDetails) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Optional refresh trigger */
  refreshTrigger?: number;
}

/**
 * Displays company details in a card format.
 */
export function CompanyDetailsCard({
  companyId,
  onLoad,
  onError,
  refreshTrigger,
}: Readonly<CompanyDetailsCardProps>) {
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await companyService.getCompany(companyId);
      setCompany(data);
      onLoad?.(data);
    } catch {
      const errorMsg = 'Failed to load company details';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, onLoad, onError]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany, refreshTrigger]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error || !company) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-400">{error || 'Company not found'}</p>
          <button
            onClick={() => fetchCompany()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Company Name and Status */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{company.name}</h2>
          {company.registrationNumber && (
            <p className="mt-1 text-sm font-mono text-steel-400">
              {company.registrationNumber}
            </p>
          )}
        </div>
        <Badge variant={company.isActive ? 'success' : 'danger'}>
          {company.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Roles */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-steel-400 mb-2">Roles</h3>
        <div className="flex flex-wrap gap-2">
          {company.roles.map(role => (
            <Badge key={role.id} variant={ROLE_BADGE_VARIANTS[role.roleType]}>
              {ROLE_TYPE_LABELS[role.roleType]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Company Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
            Contact Information
          </h3>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Contact Person</dt>
              <dd className="text-sm text-steel-200">{company.contactPerson || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Phone</dt>
              <dd className="text-sm text-steel-200">{company.phone || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Email</dt>
              <dd className="text-sm text-steel-200">{company.email || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Address</dt>
              <dd className="text-sm text-steel-200">{company.address || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Business Information */}
        <div>
          <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
            Business Information
          </h3>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Representative</dt>
              <dd className="text-sm text-steel-200">{company.representative || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Business Type</dt>
              <dd className="text-sm text-steel-200">{company.businessType || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Category</dt>
              <dd className="text-sm text-steel-200">{company.businessCategory || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Bank Account</dt>
              <dd className="text-sm text-steel-200">{company.bankAccount || '-'}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-steel-500">Payment Terms</dt>
              <dd className="text-sm text-steel-200">{company.paymentTerms || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Role Details */}
      {company.roles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
            Role Details
          </h3>
          <div className="space-y-4">
            {company.roles.map(role => (
              <div
                key={role.id}
                className="p-4 bg-steel-900/50 rounded-lg border border-steel-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={ROLE_BADGE_VARIANTS[role.roleType]}>
                    {ROLE_TYPE_LABELS[role.roleType]}
                  </Badge>
                  <span className="text-xs text-steel-500">
                    Added {formatDate(role.createdAt)}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {role.creditLimit !== null && role.creditLimit !== undefined && (
                    <div>
                      <dt className="text-steel-500">Credit Limit</dt>
                      <dd className="text-steel-200">
                        {new Intl.NumberFormat('ko-KR', {
                          style: 'currency',
                          currency: 'KRW',
                        }).format(role.creditLimit)}
                      </dd>
                    </div>
                  )}
                  {role.defaultPaymentDays !== null && role.defaultPaymentDays !== undefined && (
                    <div>
                      <dt className="text-steel-500">Payment Days</dt>
                      <dd className="text-steel-200">{role.defaultPaymentDays} days</dd>
                    </div>
                  )}
                  {role.notes && (
                    <div className="col-span-2">
                      <dt className="text-steel-500">Notes</dt>
                      <dd className="text-steel-200">{role.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-6 pt-4 border-t border-steel-800 text-xs text-steel-500 flex gap-4">
        <span>Created: {formatDate(company.createdAt)}</span>
        {company.updatedAt && <span>Updated: {formatDate(company.updatedAt)}</span>}
      </div>
    </Card>
  );
}
