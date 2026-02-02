/**
 * Vendor Offerings Modal Widget.
 *
 * Displays vendor material offerings with management actions.
 * Extracted from MaterialsTab to reduce component size.
 *
 * FSD Layer: widgets (composes features for CRUD actions)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MaterialListItem, VendorMaterialOffering } from '@/entities/material';
import { materialQueries, setPreferredVendorOffering } from '@/entities/material';
import { VendorMaterialOfferingFormModal } from '@/features/items/vendor-material-offering/form';
import { DeleteVendorMaterialOfferingModal } from '@/features/items/vendor-material-offering/delete';
import { Badge, Button, Modal, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';

export interface VendorOfferingsModalProps {
  /** The material to show offerings for */
  material: MaterialListItem | null;
  /** Called when modal should close */
  onClose: () => void;
  /** Whether user can manage offerings */
  canManage?: boolean;
}

export function VendorOfferingsModal({
  material,
  onClose,
  canManage = false,
}: Readonly<VendorOfferingsModalProps>) {
  const { t } = useTranslation('items');
  const queryClient = useQueryClient();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<VendorMaterialOffering | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOffering, setDeletingOffering] = useState<VendorMaterialOffering | null>(null);

  // Set preferred vendor mutation
  const setPreferredMutation = useMutation({
    mutationFn: setPreferredVendorOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
    },
  });

  // Server state for offerings
  const { data: offeringsData, isLoading: offeringsLoading } = useQuery({
    ...materialQueries.offeringList(material?.id ?? 0),
    enabled: !!material,
  });

  const offerings = offeringsData?.data ?? [];

  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return '-';
    return formatCurrency(price);
  };

  const handleSetPreferred = (offeringId: number) => {
    setPreferredMutation.mutate(offeringId);
  };

  const handleOpenCreate = () => {
    setEditingOffering(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (offering: VendorMaterialOffering) => {
    setEditingOffering(offering);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOffering(undefined);
  };

  const handleOpenDelete = (offering: VendorMaterialOffering) => {
    setDeletingOffering(offering);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeletingOffering(null);
  };

  if (!material) return null;

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('materials.offerings.modalTitle', { name: material.name })}
        size="lg"
      >
        {offeringsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : offerings.length === 0 ? (
          <div className="py-8 text-center text-steel-400">
            <p>{t('materials.offerings.empty')}</p>
            {canManage && (
              <Button variant="primary" className="mt-4" onClick={handleOpenCreate}>
                {t('materials.offerings.addOffering')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-steel-700/50">
              <table className="min-w-full divide-y divide-steel-700/50">
                <thead className="bg-steel-800/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                      {t('table.headers.vendor')}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                      {t('table.headers.unitPrice')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                      {t('table.headers.leadTime')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                      {t('table.headers.effectivePeriod')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                      {t('table.headers.preferred')}
                    </th>
                    {canManage && (
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                        {t('table.headers.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
                  {offerings.map(offering => (
                    <tr key={offering.id} className="hover:bg-steel-800/30">
                      <td className="px-4 py-3 text-sm text-white">
                        {offering.vendorName}
                        {offering.vendorMaterialName && (
                          <span className="ml-2 text-steel-400">
                            ({offering.vendorMaterialName})
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
                        {formatPrice(offering.unitPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                        {offering.leadTimeDays
                          ? t('common.days', { count: offering.leadTimeDays })
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                        {offering.effectiveFrom && offering.effectiveTo
                          ? `${offering.effectiveFrom} ~ ${offering.effectiveTo}`
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        {offering.isPreferred ? (
                          <Badge variant="warning" size="sm">{t('table.headers.preferred')}</Badge>
                        ) : canManage ? (
                          <button
                            onClick={() => handleSetPreferred(offering.id)}
                            className="text-xs text-steel-400 hover:text-amber-400"
                            disabled={setPreferredMutation.isPending}
                          >
                            {t('materials.offerings.setAsPreferred')}
                          </button>
                        ) : null}
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenEdit(offering)}
                            className="text-sm text-steel-400 hover:text-white"
                          >
                            {t('actions.edit')}
                          </button>
                          <button
                            onClick={() => handleOpenDelete(offering)}
                            className="ml-3 text-sm text-red-400 hover:text-red-300"
                          >
                            {t('actions.delete')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canManage && (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleOpenCreate}>
                  {t('materials.offerings.addOffering')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Vendor Material Offering Form Modal */}
      <VendorMaterialOfferingFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        offering={editingOffering}
        materialId={material.id}
        materialName={material.name}
      />

      {/* Vendor Material Offering Delete Modal */}
      <DeleteVendorMaterialOfferingModal
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        offering={deletingOffering}
      />
    </>
  );
}
