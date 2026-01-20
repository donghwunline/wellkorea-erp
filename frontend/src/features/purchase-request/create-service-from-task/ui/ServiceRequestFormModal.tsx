/**
 * Service Purchase Request Form Modal.
 *
 * Modal for creating a service (outsourcing) purchase request from a task node.
 * Allows user to select a service category and fill in request details.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, FormField, Modal, Spinner } from '@/shared/ui';
import { catalogQueries, type ServiceCategoryListItem } from '@/entities/catalog';
import { blueprintQueries, type BlueprintAttachment } from '@/entities/blueprint-attachment';
import type { CreateServicePurchaseRequestInput } from '@/entities/purchase-request';
import { useCreateServiceRequest } from '../model/use-create-service-request';

export interface ServiceRequestFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Project ID for the purchase request */
  projectId: number;
  /** TaskFlow ID for fetching attachments */
  flowId: number;
  /** Node ID for fetching node-specific attachments */
  nodeId: string | null;
  /** Called after successful creation */
  onSuccess?: () => void;
}

interface FormState {
  serviceCategoryId: number | null;
  description: string;
  quantity: string;
  uom: string;
  requiredDate: string;
}

const initialFormState: FormState = {
  serviceCategoryId: null,
  description: '',
  quantity: '1',
  uom: '건',
  requiredDate: '',
};

/**
 * Modal for creating a service (outsourcing) purchase request from a task.
 */
export function ServiceRequestFormModal({
  isOpen,
  onClose,
  projectId,
  flowId,
  nodeId,
  onSuccess,
}: Readonly<ServiceRequestFormModalProps>) {
  const { t } = useTranslation('common');
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);

  // Fetch service categories for dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    ...catalogQueries.allCategories(),
    enabled: isOpen,
  });

  // Fetch node attachments to show existing blueprints
  const { data: attachments } = useQuery({
    ...blueprintQueries.byNode(flowId, nodeId ?? ''),
    enabled: isOpen && nodeId !== null,
  });

  const createMutation = useCreateServiceRequest({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('purchaseRequest.errors.outsourceFailed'));
    },
  });

  const handleClose = () => {
    setFormState(initialFormState);
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formState.serviceCategoryId) {
      setError(t('purchaseRequest.errors.selectCategory'));
      return;
    }

    if (!formState.description.trim()) {
      setError(t('purchaseRequest.errors.enterContent'));
      return;
    }

    const quantity = parseFloat(formState.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError(t('purchaseRequest.errors.quantityPositive'));
      return;
    }

    if (!formState.requiredDate) {
      setError(t('purchaseRequest.errors.selectRequiredDate'));
      return;
    }

    const input: CreateServicePurchaseRequestInput = {
      serviceCategoryId: formState.serviceCategoryId,
      projectId,
      description: formState.description.trim(),
      quantity,
      uom: formState.uom.trim() || null,
      requiredDate: formState.requiredDate,
    };

    createMutation.mutate(input);
  };

  const activeCategories = categories?.filter((c: ServiceCategoryListItem) => c.isActive) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('purchaseRequest.outsourceTitle')} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Service Category Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-steel-300">
            {t('purchaseRequest.serviceCategory')} <span className="text-red-400">*</span>
          </label>
          {categoriesLoading ? (
            <div className="flex h-10 items-center justify-center rounded-lg border border-steel-700/50 bg-steel-900/60">
              <Spinner size="sm" />
            </div>
          ) : (
            <select
              value={formState.serviceCategoryId ?? ''}
              onChange={e => setFormState(s => ({ ...s, serviceCategoryId: e.target.value ? Number(e.target.value) : null }))}
              className="h-10 rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white focus:border-copper-500 focus:outline-none"
              required
            >
              <option value="">{t('purchaseRequest.selectCategory')}</option>
              {activeCategories.map((category: ServiceCategoryListItem) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-steel-300">
            {t('purchaseRequest.content')} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formState.description}
            onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
            placeholder={t('purchaseRequest.outsourceContent')}
            rows={3}
            className="rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder:text-steel-500 focus:border-copper-500 focus:outline-none"
            required
          />
        </div>

        {/* Quantity and UOM */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('purchaseRequest.quantity')}
            value={formState.quantity}
            onChange={value => setFormState(s => ({ ...s, quantity: value }))}
            type="number"
            placeholder="1"
            required
          />
          <FormField
            label={t('purchaseRequest.unit')}
            value={formState.uom}
            onChange={value => setFormState(s => ({ ...s, uom: value }))}
            placeholder="건"
          />
        </div>

        {/* Required Date */}
        <DatePicker
          label={t('purchaseRequest.requiredDate')}
          mode="single"
          value={formState.requiredDate}
          onChange={value => setFormState(s => ({ ...s, requiredDate: value as string }))}
          placeholder={t('purchaseRequest.selectRequiredDate')}
          required
        />

        {/* Existing Attachments Info */}
        {attachments && attachments.length > 0 && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('purchaseRequest.attachmentsInfo', { count: attachments.length })}</span>
            </div>
            <ul className="mt-2 space-y-1 pl-6 text-xs text-steel-400">
              {attachments.slice(0, 3).map((att: BlueprintAttachment) => (
                <li key={att.id}>{att.fileName}</li>
              ))}
              {attachments.length > 3 && (
                <li>{t('purchaseRequest.andMore', { count: attachments.length - 3 })}</li>
              )}
            </ul>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('buttons.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            {t('purchaseRequest.outsourceTitle')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
