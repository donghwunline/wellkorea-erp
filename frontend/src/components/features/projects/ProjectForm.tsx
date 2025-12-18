/**
 * Project Form Component
 *
 * Reusable form for creating and editing projects.
 * Receives customer/user options as props (supports mock data).
 */

import { type FormEvent, useMemo, useState } from 'react';
import type { CreateProjectRequest, ProjectDetails, UpdateProjectRequest } from '@/services';
import { Button, Combobox, type ComboboxOption, DatePicker, ErrorAlert, FormField } from '@/components/ui';

export interface SelectOption {
  id: number;
  name: string;
}

export interface ProjectFormProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: ProjectDetails | null;
  /** Available customers for dropdown */
  customers: SelectOption[];
  /** Available users for internal owner dropdown */
  users: SelectOption[];
  /** Called when form is submitted */
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** External error message */
  error?: string | null;
  /** Called when error is dismissed */
  onDismissError?: () => void;
}

/**
 * Project form for create and edit operations.
 */
export function ProjectForm({
  mode,
  initialData,
  customers,
  users,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  onDismissError,
}: Readonly<ProjectFormProps>) {
  // Form state - initialize from initialData if editing (form is only rendered after data loads)
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && initialData) {
      return {
        customerId: initialData.customerId as number | null,
        projectName: initialData.projectName,
        requesterName: initialData.requesterName || '',
        dueDate: initialData.dueDate,
        internalOwnerId: initialData.internalOwnerId as number | null,
      };
    }
    return {
      customerId: null as number | null,
      projectName: '',
      requesterName: '',
      dueDate: '',
      internalOwnerId: null as number | null,
    };
  });

  // Convert SelectOption to ComboboxOption for use with Combobox
  const customerOptions: ComboboxOption[] = useMemo(
    () => customers.map(c => ({ id: c.id, label: c.name })),
    [customers]
  );

  const userOptions: ComboboxOption[] = useMemo(
    () => users.map(u => ({ id: u.id, label: u.name })),
    [users]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      const request: CreateProjectRequest = {
        customerId: formData.customerId!,
        projectName: formData.projectName.trim(),
        requesterName: formData.requesterName.trim() || undefined,
        dueDate: formData.dueDate,
        internalOwnerId: formData.internalOwnerId!,
      };
      await onSubmit(request);
    } else {
      const request: UpdateProjectRequest = {
        projectName: formData.projectName.trim(),
        requesterName: formData.requesterName.trim() || undefined,
        dueDate: formData.dueDate,
      };
      await onSubmit(request);
    }
  };

  // Validation helpers
  const projectNameTrimmed = formData.projectName.trim();
  const hasWhitespaceOnlyName = formData.projectName.length > 0 && projectNameTrimmed.length === 0;

  // Check if form is valid
  const isValid =
    formData.customerId !== null &&
    projectNameTrimmed &&
    formData.dueDate &&
    formData.internalOwnerId !== null;

  // Validation error messages
  const validationErrors = {
    projectName: hasWhitespaceOnlyName ? 'Project name cannot be whitespace only' : undefined,
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      {/* Customer Selection */}
      <Combobox
        label="Customer"
        value={formData.customerId}
        onChange={(value) => setFormData(prev => ({ ...prev, customerId: value as number | null }))}
        options={customerOptions}
        placeholder="Search or select a customer..."
        required
        disabled={isSubmitting || mode === 'edit'}
        helpText={mode === 'edit' ? 'Customer cannot be changed after creation' : undefined}
      />

      {/* Project Name */}
      <FormField
        label="Project Name"
        type="text"
        value={formData.projectName}
        onChange={value => setFormData(prev => ({ ...prev, projectName: value }))}
        required
        disabled={isSubmitting}
        placeholder="Enter project name"
        maxLength={255}
        error={validationErrors.projectName}
      />

      {/* Requester Name */}
      <FormField
        label="Requester Name"
        type="text"
        value={formData.requesterName}
        onChange={value => setFormData(prev => ({ ...prev, requesterName: value }))}
        disabled={isSubmitting}
        placeholder="Enter requester name (optional)"
        maxLength={100}
      />

      {/* Due Date */}
      <DatePicker
        label="Due Date"
        value={formData.dueDate}
        onChange={value => setFormData(prev => ({ ...prev, dueDate: value as string }))}
        required
        disabled={isSubmitting}
        min={today}
        placeholder="Select due date..."
      />

      {/* Internal Owner Selection */}
      <Combobox
        label="Internal Owner"
        value={formData.internalOwnerId}
        onChange={(value) => setFormData(prev => ({ ...prev, internalOwnerId: value as number | null }))}
        options={userOptions}
        placeholder="Search or select internal owner..."
        required
        disabled={isSubmitting || mode === 'edit'}
        helpText={mode === 'edit' ? 'Internal owner cannot be changed after creation' : undefined}
      />

      {/* Job Code (read-only in edit mode) */}
      {mode === 'edit' && initialData && (
        <div>
          <label className="mb-2 block text-sm font-medium text-steel-300">Job Code</label>
          <div className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-4 py-2.5">
            <span className="font-mono text-copper-400">{initialData.jobCode}</span>
          </div>
          <p className="mt-1 text-xs text-steel-500">Job Code is auto-generated and read-only</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!isValid}>
          {mode === 'create' ? 'Create Project' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
