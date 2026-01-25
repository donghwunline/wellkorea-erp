/**
 * Company Form Component
 *
 * Reusable form for creating and editing companies.
 * Includes role selection with checkboxes.
 *
 * FSD Layer: features
 * - Contains form logic and validation
 * - Uses entity types for form data
 */

import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorAlert, FormField } from '@/shared/ui';
import type { Company, RoleType } from '@/entities/company';
import { ROLE_TYPE_LABELS } from '@/entities/company';

export interface CompanyFormData {
  name: string;
  registrationNumber: string;
  representative: string;
  businessType: string;
  businessCategory: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  bankAccount: string;
  paymentTerms: string;
  roles: RoleType[];
}

export interface CompanyFormProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: Company | null;
  /** Called when form is submitted */
  onSubmit: (data: CompanyFormData) => Promise<void>;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** External error message */
  error?: string | null;
  /** Called when error is dismissed */
  onDismissError?: () => void;
}

const ALL_ROLE_TYPES: RoleType[] = ['CUSTOMER', 'VENDOR', 'OUTSOURCE'];

/**
 * Company form for create and edit operations.
 */
export function CompanyForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  onDismissError,
}: Readonly<CompanyFormProps>) {
  const { t } = useTranslation(['companies', 'common']);

  // Form state - initialize from initialData if editing
  const [formData, setFormData] = useState<CompanyFormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        name: initialData.name,
        registrationNumber: initialData.registrationNumber || '',
        representative: initialData.representative || '',
        businessType: initialData.businessType || '',
        businessCategory: initialData.businessCategory || '',
        contactPerson: initialData.contactPerson || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        bankAccount: initialData.bankAccount || '',
        paymentTerms: initialData.paymentTerms || '',
        roles: initialData.roles.map(r => r.roleType),
      };
    }
    return {
      name: '',
      registrationNumber: '',
      representative: '',
      businessType: '',
      businessCategory: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankAccount: '',
      paymentTerms: '',
      roles: [],
    };
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Role toggle handler
  const toggleRole = (role: RoleType) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role],
    }));
  };

  // Validation helpers
  const nameTrimmed = formData.name.trim();
  const hasWhitespaceOnlyName = formData.name.length > 0 && nameTrimmed.length === 0;

  // Check if form is valid
  const isValid = nameTrimmed && (mode === 'edit' || formData.roles.length > 0);

  // Validation error messages
  const validationErrors = {
    name: hasWhitespaceOnlyName ? t('form.validation.nameWhitespace') : undefined,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      {/* Basic Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          {t('common:sections.basicInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t('form.companyName')}
            value={formData.name}
            onChange={value => setFormData(prev => ({ ...prev, name: value }))}
            required
            disabled={isSubmitting}
            error={validationErrors.name}
            placeholder={t('form.placeholders.companyName')}
          />
          <FormField
            label={t('form.registrationNumber')}
            value={formData.registrationNumber}
            onChange={value => setFormData(prev => ({ ...prev, registrationNumber: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.registrationNumber')}
          />
          <FormField
            label={t('form.representative')}
            value={formData.representative}
            onChange={value => setFormData(prev => ({ ...prev, representative: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.representative')}
          />
          <FormField
            label={t('form.businessType')}
            value={formData.businessType}
            onChange={value => setFormData(prev => ({ ...prev, businessType: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.businessType')}
          />
          <FormField
            label={t('form.businessCategory')}
            value={formData.businessCategory}
            onChange={value => setFormData(prev => ({ ...prev, businessCategory: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.businessCategory')}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          {t('common:sections.contactInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t('form.contactPerson')}
            value={formData.contactPerson}
            onChange={value => setFormData(prev => ({ ...prev, contactPerson: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.contactPerson')}
          />
          <FormField
            label={t('form.phone')}
            value={formData.phone}
            onChange={value => setFormData(prev => ({ ...prev, phone: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.phone')}
          />
          <FormField
            label={t('form.email')}
            type="email"
            value={formData.email}
            onChange={value => setFormData(prev => ({ ...prev, email: value }))}
            required
            disabled={isSubmitting}
            placeholder={t('form.placeholders.email')}
          />
          <FormField
            label={t('form.address')}
            value={formData.address}
            onChange={value => setFormData(prev => ({ ...prev, address: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.address')}
          />
        </div>
      </div>

      {/* Financial Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          {t('common:sections.financialInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t('form.bankAccount')}
            value={formData.bankAccount}
            onChange={value => setFormData(prev => ({ ...prev, bankAccount: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.bankAccount')}
          />
          <FormField
            label={t('form.paymentTerms')}
            value={formData.paymentTerms}
            onChange={value => setFormData(prev => ({ ...prev, paymentTerms: value }))}
            disabled={isSubmitting}
            placeholder={t('form.placeholders.paymentTerms')}
          />
        </div>
      </div>

      {/* Role Selection (only for create mode) */}
      {mode === 'create' && (
        <div>
          <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
            {t('form.companyRoles')} <span className="text-red-400">*</span>
          </h3>
          <p className="text-xs text-steel-500 mb-3">{t('form.rolesDescription')}</p>
          <div className="flex flex-wrap gap-4">
            {ALL_ROLE_TYPES.map(role => (
              <label key={role} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-steel-600 bg-steel-800 text-copper-500
                             focus:ring-copper-500 focus:ring-offset-0 focus:ring-offset-steel-900"
                />
                <span className="text-sm text-steel-300 group-hover:text-white transition-colors">
                  {ROLE_TYPE_LABELS[role]}
                </span>
              </label>
            ))}
          </div>
          {formData.roles.length === 0 && (
            <p className="text-xs text-red-400 mt-2">{t('form.selectRole')}</p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-steel-800">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('common:buttons.cancel')}
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
          {mode === 'create' ? t('form.createCompany') : t('form.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
