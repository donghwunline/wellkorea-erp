/**
 * Company Detail Card.
 *
 * Pure display component for company details.
 * Receives data via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Company } from '../model/company';
import { formatDate } from '@/shared/lib/formatting/date';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { CompanyRoleBadge } from './CompanyRoleBadge';

export interface CompanyCardProps {
  /**
   * Company to display.
   */
  company: Company;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions (Edit, Delete, etc.).
   */
  renderActions?: () => ReactNode;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Card component for displaying company details.
 *
 * This is a pure display component that:
 * - Renders all company information in a structured layout
 * - Shows roles with their financial settings
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function CompanyDetailPage({ id }: { id: number }) {
 *   const { data: company } = useQuery(companyQueries.detail(id));
 *
 *   if (!company) return null;
 *
 *   return (
 *     <CompanyCard
 *       company={company}
 *       renderActions={() => (
 *         <>
 *           {companyRules.canEdit(company) && <EditButton companyId={company.id} />}
 *           {companyRules.canDelete(company) && <DeleteButton companyId={company.id} />}
 *         </>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function CompanyCard({
  company,
  renderActions,
  className,
}: Readonly<CompanyCardProps>) {
  const { t } = useTranslation('entities');

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{company.name}</h2>
            {company.registrationNumber && (
              <p className="mt-1 text-sm font-mono text-steel-400">
                {company.registrationNumber}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CompanyStatusBadge isActive={company.isActive} />
            {renderActions?.()}
          </div>
        </div>

        {/* Roles Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-steel-400 mb-2">{t('company.card.roles')}</h3>
          <div className="flex flex-wrap gap-2">
            {company.roles.map(role => (
              <CompanyRoleBadge key={role.roleType} roleType={role.roleType} />
            ))}
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
              {t('company.card.contactInfo')}
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.contactPerson')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.contactPerson || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.phone')}</dt>
                <dd className="text-sm text-steel-200">{company.phone || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.email')}</dt>
                <dd className="text-sm text-steel-200">{company.email || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.address')}</dt>
                <dd className="text-sm text-steel-200">{company.address || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
              {t('company.card.businessInfo')}
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.representative')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.representative || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.businessType')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.businessType || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.businessCategory')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.businessCategory || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.bankAccount')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.bankAccount || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">{t('company.card.paymentTerms')}</dt>
                <dd className="text-sm text-steel-200">
                  {company.paymentTerms || '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t border-steel-800 text-xs text-steel-500 flex gap-4">
          <span>{t('company.card.createdAt')}: {formatDate(company.createdAt)}</span>
          <span>{t('company.card.updatedAt')}: {formatDate(company.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}
