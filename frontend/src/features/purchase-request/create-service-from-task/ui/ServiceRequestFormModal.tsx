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
import { ApiError } from '@/shared/api';
import { ATTACHMENT_LIMITS } from '@/shared/lib/attachment-limits';
import { catalogQueries, type ServiceCategoryListItem } from '@/entities/catalog';
import { type BlueprintAttachment, blueprintQueries } from '@/entities/blueprint-attachment';
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
  uom: '',
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
  const { t } = useTranslation(['common', 'items']);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  // Exclusion set pattern: empty = all selected (default)
  const [excludedAttachmentIds, setExcludedAttachmentIds] = useState<Set<number>>(new Set());

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

  // Derive selected: all except excluded
  const selectedAttachments = attachments?.filter(a => !excludedAttachmentIds.has(a.id)) ?? [];

  const createMutation = useCreateServiceRequest({});

  const handleClose = () => {
    setFormState(initialFormState);
    setError(null);
    setExcludedAttachmentIds(new Set());
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      attachments: selectedAttachments.map(att => ({
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        storagePath: att.storagePath,
      })),
    };

    try {
      await createMutation.mutateAsync(input);
      onSuccess?.();
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.errorCode) {
          case 'ATTACHMENT_SIZE_EXCEEDED':
            setError(
              t('purchaseRequest.errors.attachmentSizeExceeded', {
                limit: ATTACHMENT_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024,
              })
            );
            break;
          case 'ATTACHMENT_COUNT_EXCEEDED':
            setError(
              t('purchaseRequest.errors.attachmentCountExceeded', {
                limit: ATTACHMENT_LIMITS.MAX_ATTACHMENT_COUNT,
              })
            );
            break;
          case 'VAL_001':
            setError(err.message || t('purchaseRequest.errors.validationError'));
            break;
          default:
            setError(err.message || t('purchaseRequest.errors.outsourceFailed'));
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('purchaseRequest.errors.networkError'));
      }
    }
  };

  const activeCategories = categories?.filter((c: ServiceCategoryListItem) => c.isActive) ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('purchaseRequest.outsourceTitle')}
      size="md"
    >
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
              onChange={e =>
                setFormState(s => ({
                  ...s,
                  serviceCategoryId: e.target.value ? Number(e.target.value) : null,
                }))
              }
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
            label={t('common:purchaseRequest.unit')}
            value={formState.uom}
            onChange={value => setFormState(s => ({ ...s, uom: value }))}
            placeholder={t('items:units.defaultServiceUnit')}
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

        {/* Attachment Selection */}
        {attachments && attachments.length > 0 && (
          <div className="rounded-lg border border-steel-700 bg-steel-800/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-steel-300">
                {t('purchaseRequest.attachToRfq')}
              </span>
              <button
                type="button"
                onClick={() =>
                  setExcludedAttachmentIds(
                    excludedAttachmentIds.size === 0
                      ? new Set(attachments.map(a => a.id)) // Exclude all
                      : new Set() // Clear exclusions = select all
                  )
                }
                className="text-xs text-copper-400 hover:underline"
              >
                {excludedAttachmentIds.size === 0
                  ? t('buttons.deselectAll')
                  : t('buttons.selectAll')}
              </button>
            </div>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {attachments.map((att: BlueprintAttachment) => (
                <label key={att.id} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!excludedAttachmentIds.has(att.id)}
                    onChange={e => {
                      setExcludedAttachmentIds(prev => {
                        const newSet = new Set(prev);
                        if (e.target.checked) {
                          newSet.delete(att.id); // Remove from exclusions = selected
                        } else {
                          newSet.add(att.id); // Add to exclusions = unselected
                        }
                        return newSet;
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-steel-600 bg-steel-800 text-copper-500"
                  />
                  <span className="truncate text-xs text-steel-400">{att.fileName}</span>
                  <span className="text-xs text-steel-500">({att.formattedFileSize})</span>
                </label>
              ))}
            </div>
            {/* Size warning for email limit */}
            {selectedAttachments.reduce((sum, a) => sum + a.fileSize, 0) >
              ATTACHMENT_LIMITS.MAX_TOTAL_SIZE && (
              <p className="mt-2 text-xs text-amber-400">{t('purchaseRequest.sizeLimitWarning')}</p>
            )}
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
