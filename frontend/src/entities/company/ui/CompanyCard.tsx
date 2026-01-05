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
import { Card } from '@/shared/ui';
import type { Company } from '../model/company';
import { roleRules } from '../model/company-role';
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
          <h3 className="text-sm font-medium text-steel-400 mb-2">역할</h3>
          <div className="flex flex-wrap gap-2">
            {company.roles.map(role => (
              <CompanyRoleBadge key={role.id} roleType={role.roleType} />
            ))}
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
              연락처 정보
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">담당자</dt>
                <dd className="text-sm text-steel-200">
                  {company.contactPerson || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">전화번호</dt>
                <dd className="text-sm text-steel-200">{company.phone || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">이메일</dt>
                <dd className="text-sm text-steel-200">{company.email || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">주소</dt>
                <dd className="text-sm text-steel-200">{company.address || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
              사업자 정보
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">대표자</dt>
                <dd className="text-sm text-steel-200">
                  {company.representative || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">업태</dt>
                <dd className="text-sm text-steel-200">
                  {company.businessType || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">업종</dt>
                <dd className="text-sm text-steel-200">
                  {company.businessCategory || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">계좌번호</dt>
                <dd className="text-sm text-steel-200">
                  {company.bankAccount || '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-sm text-steel-500">결제조건</dt>
                <dd className="text-sm text-steel-200">
                  {company.paymentTerms || '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Role Details Section */}
        {company.roles.some(r => roleRules.hasFinancialSettings(r) || roleRules.hasNotes(r)) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-steel-400 mb-3 border-b border-steel-800 pb-2">
              역할별 상세 정보
            </h3>
            <div className="space-y-4">
              {company.roles.map(role => (
                <div
                  key={role.id}
                  className="p-4 bg-steel-900/50 rounded-lg border border-steel-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CompanyRoleBadge roleType={role.roleType} />
                    <span className="text-xs text-steel-500">
                      등록일: {formatDate(role.createdAt)}
                    </span>
                  </div>
                  {(roleRules.hasFinancialSettings(role) || roleRules.hasNotes(role)) && (
                    <dl className="grid grid-cols-2 gap-2 text-sm mt-3">
                      {role.creditLimit !== null && (
                        <div>
                          <dt className="text-steel-500">신용 한도</dt>
                          <dd className="text-steel-200">
                            {roleRules.formatCreditLimit(role)}
                          </dd>
                        </div>
                      )}
                      {role.defaultPaymentDays !== null && (
                        <div>
                          <dt className="text-steel-500">결제 기한</dt>
                          <dd className="text-steel-200">
                            {roleRules.getPaymentDaysText(role)}
                          </dd>
                        </div>
                      )}
                      {role.notes && (
                        <div className="col-span-2">
                          <dt className="text-steel-500">비고</dt>
                          <dd className="text-steel-200">{role.notes}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t border-steel-800 text-xs text-steel-500 flex gap-4">
          <span>생성일: {formatDate(company.createdAt)}</span>
          <span>수정일: {formatDate(company.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}
