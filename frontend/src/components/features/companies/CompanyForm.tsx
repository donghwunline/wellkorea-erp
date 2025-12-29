/**
 * Company Form Component
 *
 * Reusable form for creating and editing companies.
 * Includes role selection with checkboxes.
 */

import { type FormEvent, useState } from 'react';
import type { CreateCompanyRequest, CompanyDetails, UpdateCompanyRequest, RoleType } from '@/services';
import { ROLE_TYPE_LABELS } from '@/services';
import { Button, ErrorAlert, FormField } from '@/components/ui';

export interface CompanyFormProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: CompanyDetails | null;
  /** Called when form is submitted */
  onSubmit: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>;
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
  // Form state - initialize from initialData if editing
  const [formData, setFormData] = useState(() => {
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
      roles: [] as RoleType[],
    };
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      const request: CreateCompanyRequest = {
        name: formData.name.trim(),
        registrationNumber: formData.registrationNumber.trim() || null,
        representative: formData.representative.trim() || null,
        businessType: formData.businessType.trim() || null,
        businessCategory: formData.businessCategory.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        bankAccount: formData.bankAccount.trim() || null,
        paymentTerms: formData.paymentTerms.trim() || null,
        roles: formData.roles,
      };
      await onSubmit(request);
    } else {
      const request: UpdateCompanyRequest = {
        name: formData.name.trim() || null,
        registrationNumber: formData.registrationNumber.trim() || null,
        representative: formData.representative.trim() || null,
        businessType: formData.businessType.trim() || null,
        businessCategory: formData.businessCategory.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        bankAccount: formData.bankAccount.trim() || null,
        paymentTerms: formData.paymentTerms.trim() || null,
      };
      await onSubmit(request);
    }
  };

  // Role toggle handler
  const toggleRole = (role: RoleType) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  // Validation helpers
  const nameTrimmed = formData.name.trim();
  const hasWhitespaceOnlyName = formData.name.length > 0 && nameTrimmed.length === 0;

  // Check if form is valid
  const isValid = nameTrimmed && (mode === 'edit' || formData.roles.length > 0);

  // Validation error messages
  const validationErrors = {
    name: hasWhitespaceOnlyName ? 'Company name cannot be whitespace only' : undefined,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      {/* Basic Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Company Name"
            value={formData.name}
            onChange={value => setFormData(prev => ({ ...prev, name: value }))}
            required
            disabled={isSubmitting}
            error={validationErrors.name}
            placeholder="Enter company name"
          />
          <FormField
            label="Registration Number"
            value={formData.registrationNumber}
            onChange={value => setFormData(prev => ({ ...prev, registrationNumber: value }))}
            disabled={isSubmitting}
            placeholder="000-00-00000"
          />
          <FormField
            label="Representative"
            value={formData.representative}
            onChange={value => setFormData(prev => ({ ...prev, representative: value }))}
            disabled={isSubmitting}
            placeholder="Company representative name"
          />
          <FormField
            label="Business Type"
            value={formData.businessType}
            onChange={value => setFormData(prev => ({ ...prev, businessType: value }))}
            disabled={isSubmitting}
            placeholder="e.g., Manufacturing"
          />
          <FormField
            label="Business Category"
            value={formData.businessCategory}
            onChange={value => setFormData(prev => ({ ...prev, businessCategory: value }))}
            disabled={isSubmitting}
            placeholder="e.g., Electronics"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Contact Person"
            value={formData.contactPerson}
            onChange={value => setFormData(prev => ({ ...prev, contactPerson: value }))}
            disabled={isSubmitting}
            placeholder="Primary contact name"
          />
          <FormField
            label="Phone"
            value={formData.phone}
            onChange={value => setFormData(prev => ({ ...prev, phone: value }))}
            disabled={isSubmitting}
            placeholder="02-000-0000"
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={value => setFormData(prev => ({ ...prev, email: value }))}
            disabled={isSubmitting}
            placeholder="contact@company.com"
          />
          <FormField
            label="Address"
            value={formData.address}
            onChange={value => setFormData(prev => ({ ...prev, address: value }))}
            disabled={isSubmitting}
            placeholder="Company address"
          />
        </div>
      </div>

      {/* Financial Information */}
      <div>
        <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
          Financial Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Bank Account"
            value={formData.bankAccount}
            onChange={value => setFormData(prev => ({ ...prev, bankAccount: value }))}
            disabled={isSubmitting}
            placeholder="Bank name, account number"
          />
          <FormField
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={value => setFormData(prev => ({ ...prev, paymentTerms: value }))}
            disabled={isSubmitting}
            placeholder="e.g., Net 30"
          />
        </div>
      </div>

      {/* Role Selection (only for create mode) */}
      {mode === 'create' && (
        <div>
          <h3 className="text-sm font-medium text-steel-400 mb-4 pb-2 border-b border-steel-800">
            Company Roles <span className="text-red-400">*</span>
          </h3>
          <p className="text-xs text-steel-500 mb-3">
            Select at least one role for this company. A company can have multiple roles.
          </p>
          <div className="flex flex-wrap gap-4">
            {ALL_ROLE_TYPES.map(role => (
              <label
                key={role}
                className="flex items-center gap-2 cursor-pointer group"
              >
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
            <p className="text-xs text-red-400 mt-2">Please select at least one role</p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-steel-800">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Company' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
