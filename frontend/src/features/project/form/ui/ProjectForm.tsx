/**
 * Project Form Component.
 *
 * Reusable form for creating and editing projects.
 * Presentational component - receives callbacks and doesn't own mutations.
 *
 * Uses CompanyCombobox and UserCombobox for async data loading.
 * These will be imported from entities after Phase 3 migration.
 */

import { type FormEvent, useState } from 'react';
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@/entities/project';
import { Button, DatePicker, ErrorAlert, FormField } from '@/shared/ui';
// TODO: After Phase 3, import from entities instead
import { CompanyCombobox, UserCombobox } from '@/components/features/shared/selectors';

interface ProjectFormData {
  customerId: number | null;
  projectName: string;
  requesterName: string;
  dueDate: string;
  internalOwnerId: number | null;
}

const EMPTY_FORM_DATA: ProjectFormData = {
  customerId: null,
  projectName: '',
  requesterName: '',
  dueDate: '',
  internalOwnerId: null,
};

function toFormData(data: Project): ProjectFormData {
  return {
    customerId: data.customerId,
    projectName: data.projectName,
    requesterName: data.requesterName ?? '',
    dueDate: data.dueDate,
    internalOwnerId: data.internalOwnerId,
  };
}

function toCreateInput(data: ProjectFormData): CreateProjectInput {
  return {
    customerId: data.customerId,
    projectName: data.projectName.trim(),
    requesterName: data.requesterName.trim() || undefined,
    dueDate: data.dueDate,
    internalOwnerId: data.internalOwnerId,
  };
}

function toUpdateInput(data: ProjectFormData): UpdateProjectInput {
  return {
    projectName: data.projectName.trim(),
    requesterName: data.requesterName.trim() || undefined,
    dueDate: data.dueDate,
  };
}

export interface ProjectFormProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: Project | null;
  /** Called when form is submitted */
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => Promise<void>;
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
 *
 * This is a presentational component that:
 * - Manages form state locally
 * - Delegates submit action via callback
 * - Does NOT own mutations (parent handles that)
 *
 * @example
 * ```tsx
 * function ProjectCreatePage() {
 *   const createMutation = useCreateProject();
 *   const navigate = useNavigate();
 *
 *   return (
 *     <ProjectForm
 *       mode="create"
 *       onSubmit={async (data) => {
 *         await createMutation.mutateAsync(data);
 *         navigate('/projects');
 *       }}
 *       onCancel={() => navigate('/projects')}
 *       isSubmitting={createMutation.isPending}
 *       error={createMutation.error?.message}
 *     />
 *   );
 * }
 * ```
 */
export function ProjectForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  onDismissError,
}: Readonly<ProjectFormProps>) {
  // Form state - initialize from initialData if editing, otherwise use empty defaults
  const [formData, setFormData] = useState<ProjectFormData>(
    initialData ? toFormData(initialData) : EMPTY_FORM_DATA
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = mode === 'create' ? toCreateInput(formData) : toUpdateInput(formData);
    await onSubmit(input);
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

      {/* Customer Selection (Company with CUSTOMER role) */}
      <CompanyCombobox
        label="Customer"
        value={formData.customerId}
        onChange={value => setFormData(prev => ({ ...prev, customerId: value }))}
        roleType="CUSTOMER"
        required
        disabled={isSubmitting || mode === 'edit'}
        helpText={mode === 'edit' ? 'Customer cannot be changed after creation' : undefined}
        initialLabel={initialData?.customerName}
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
      <UserCombobox
        label="Internal Owner"
        value={formData.internalOwnerId}
        onChange={value => setFormData(prev => ({ ...prev, internalOwnerId: value }))}
        placeholder="Search or select internal owner..."
        required
        disabled={isSubmitting || mode === 'edit'}
        helpText={mode === 'edit' ? 'Internal owner cannot be changed after creation' : undefined}
        initialLabel={initialData?.internalOwnerName}
      />

      {/* Job Code (read-only in edit mode) */}
      {mode === 'edit' && initialData && (
        <div>
          <span className="mb-2 block text-sm font-medium text-steel-300">Job Code</span>
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
