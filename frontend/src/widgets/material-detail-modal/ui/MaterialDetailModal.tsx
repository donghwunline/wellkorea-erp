/**
 * Material Detail Modal Widget.
 *
 * Displays material details with edit/delete actions.
 * Extracted from MaterialsTab to reduce component size.
 *
 * FSD Layer: widgets (composes features for edit/delete actions)
 */

import { useTranslation } from 'react-i18next';
import type { MaterialListItem } from '@/entities/material';
import { Button, Modal } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';

export interface MaterialDetailModalProps {
  /** The material to display */
  material: MaterialListItem | null;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when edit button clicked */
  onEdit?: () => void;
  /** Called when delete button clicked */
  onDelete?: () => void;
  /** Whether to show management actions */
  canManage?: boolean;
}

export function MaterialDetailModal({
  material,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}: Readonly<MaterialDetailModalProps>) {
  const { t } = useTranslation('items');

  if (!material) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('materials.view.modalTitle', { name: material.name })}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase text-steel-500">{t('table.headers.sku')}</label>
            <p className="font-mono text-copper-400">{material.sku}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-steel-500">{t('table.headers.category')}</label>
            <p className="text-white">{material.categoryName}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-steel-500">{t('table.headers.unit')}</label>
            <p className="text-white">{material.unit}</p>
          </div>
          <div>
            <label className="text-xs uppercase text-steel-500">
              {t('table.headers.standardPrice')}
            </label>
            <p className="text-white">
              {material.standardPrice ? formatCurrency(material.standardPrice) : '-'}
            </p>
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase text-steel-500">
              {t('materials.fields.description')}
            </label>
            <p className="text-steel-300">
              {material.description || t('materials.view.noDescription')}
            </p>
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase text-steel-500">
              {t('table.headers.preferredVendor')}
            </label>
            <p className="text-white">
              {material.preferredVendorName ?? t('materials.view.preferredVendorNone')}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex justify-end gap-2 border-t border-steel-700/50 pt-4">
            <Button variant="secondary" onClick={onEdit}>
              {t('actions.edit')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('actions.deactivate')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
