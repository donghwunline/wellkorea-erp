/**
 * Materials Tab - Displays physical materials for purchasing.
 *
 * FSD pattern:
 * - Server state via Query Factory (materialQueries)
 * - Local state for filters and pagination
 * - Entity-first approach
 *
 * Features:
 * - Paginated material list with search and category filter
 * - Drill-down to view vendor offerings per material
 * - Create/Edit/Delete materials (Admin, Finance only)
 * - Manage vendor material offerings with set preferred vendor
 */

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  materialQueries,
  setPreferredVendorOffering,
  type MaterialListItem,
  type Material,
  type VendorMaterialOffering,
} from '@/entities/material';
import { useAuth } from '@/entities/auth';
import { MaterialFormModal } from '@/features/items/material/form';
import { DeleteMaterialModal } from '@/features/items/material/delete';
import { VendorMaterialOfferingFormModal } from '@/features/items/vendor-material-offering/form';
import { DeleteVendorMaterialOfferingModal } from '@/features/items/vendor-material-offering/delete';
import { Button, Card, FilterBar, Icon, Modal, Pagination, SearchBar, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';

const PAGE_SIZE = 20;

/**
 * Materials tab content.
 */
export function MaterialsTab() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);
  const queryClient = useQueryClient();

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  // Material detail modal state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListItem | null>(null);

  // Create/Edit modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialListItem | null>(null);

  // Vendor offerings modal state
  const [materialForOfferings, setMaterialForOfferings] = useState<MaterialListItem | null>(null);

  // Vendor offering form modal state
  const [isOfferingFormOpen, setIsOfferingFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<VendorMaterialOffering | undefined>(undefined);

  // Vendor offering delete modal state
  const [isOfferingDeleteOpen, setIsOfferingDeleteOpen] = useState(false);
  const [deletingOffering, setDeletingOffering] = useState<VendorMaterialOffering | null>(null);

  // Set preferred vendor mutation
  const setPreferredMutation = useMutation({
    mutationFn: setPreferredVendorOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
    },
  });

  // Handle search change with pagination reset
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Handle category change with pagination reset
  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value ? Number(value) : undefined);
    setPage(0);
  }, []);

  // Server state for categories (for filter dropdown)
  const { data: categoriesData } = useQuery(materialQueries.categoryList());

  // Server state for materials via Query Factory
  const {
    data: materialsData,
    isLoading: materialsLoading,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery(materialQueries.list({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    categoryId,
  }));

  // Server state for offerings (only when material selected)
  const {
    data: offeringsData,
    isLoading: offeringsLoading,
  } = useQuery({
    ...materialQueries.offeringList(materialForOfferings?.id ?? 0),
    enabled: !!materialForOfferings,
  });

  const offerings = offeringsData?.data ?? [];
  const materials = materialsData?.data ?? [];
  const pagination = materialsData?.pagination;
  const categories = categoriesData ?? [];

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedMaterial(null);
  };

  // Open create modal
  const handleOpenCreate = () => {
    setEditingMaterial(undefined);
    setIsFormModalOpen(true);
  };

  // Open edit modal (convert list item to full material type for the form)
  const handleOpenEdit = () => {
    if (!selectedMaterial) return;
    // MaterialListItem has the same fields needed for editing
    setEditingMaterial({
      id: selectedMaterial.id,
      sku: selectedMaterial.sku,
      name: selectedMaterial.name,
      description: selectedMaterial.description,
      categoryId: selectedMaterial.categoryId,
      categoryName: selectedMaterial.categoryName,
      unit: selectedMaterial.unit,
      standardPrice: selectedMaterial.standardPrice,
      isActive: selectedMaterial.isActive,
      preferredVendorId: selectedMaterial.preferredVendorId,
      preferredVendorName: selectedMaterial.preferredVendorName,
      createdAt: '',
      updatedAt: '',
    });
    setIsFormModalOpen(true);
  };

  // Close form modal
  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingMaterial(undefined);
  };

  // Open delete modal
  const handleOpenDelete = () => {
    if (!selectedMaterial) return;
    setDeletingMaterial(selectedMaterial);
    setIsDeleteModalOpen(true);
  };

  // Close delete modal
  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingMaterial(null);
  };

  // Handle form success (close detail modal if we just edited)
  const handleFormSuccess = () => {
    if (editingMaterial) {
      setSelectedMaterial(null);
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setSelectedMaterial(null);
  };

  // ========== Vendor Offerings Modal Handlers ==========
  const handleOpenOfferingsModal = (material: MaterialListItem) => {
    setMaterialForOfferings(material);
  };

  const handleCloseOfferingsModal = () => {
    setMaterialForOfferings(null);
  };

  const handleOpenOfferingCreate = () => {
    setEditingOffering(undefined);
    setIsOfferingFormOpen(true);
  };

  const handleOpenOfferingEdit = (offering: VendorMaterialOffering) => {
    setEditingOffering(offering);
    setIsOfferingFormOpen(true);
  };

  const handleCloseOfferingForm = () => {
    setIsOfferingFormOpen(false);
    setEditingOffering(undefined);
  };

  const handleOpenOfferingDelete = (offering: VendorMaterialOffering) => {
    setDeletingOffering(offering);
    setIsOfferingDeleteOpen(true);
  };

  const handleCloseOfferingDelete = () => {
    setIsOfferingDeleteOpen(false);
    setDeletingOffering(null);
  };

  const handleSetPreferred = (offeringId: number) => {
    setPreferredMutation.mutate(offeringId);
  };

  // Format price
  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return '-';
    return formatCurrency(price);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SearchBar
            value={search}
            onValueChange={handleSearchChange}
            placeholder="Search materials by name or SKU..."
            className="w-72"
          />

          <FilterBar.Select
            value={categoryId?.toString() ?? ''}
            onValueChange={handleCategoryChange}
            options={categories.map(category => ({
              value: category.id.toString(),
              label: category.name,
            }))}
            placeholder="All Categories"
            className="w-48"
          />
        </div>

        {canManage && (
          <Button variant="primary" onClick={handleOpenCreate}>
            Add Material
          </Button>
        )}
      </div>

      {/* Error */}
      {materialsError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load materials</p>
          <button
            onClick={() => refetchMaterials()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Loading */}
      {materialsLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Material List */}
      {!materialsLoading && !materialsError && materials.length === 0 && (
        <Card className="p-8 text-center text-steel-400">
          <p>No materials found.</p>
          {canManage && (
            <p className="mt-2">
              Click &quot;Add Material&quot; to create your first material.
            </p>
          )}
        </Card>
      )}

      {!materialsLoading && !materialsError && materials.length > 0 && (
        <>
          {/* Table View */}
          <Card variant="table" className="overflow-hidden">
            <table className="min-w-full divide-y divide-steel-700/50">
              <thead className="bg-steel-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                    Standard Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Preferred Vendor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
                {materials.map(material => (
                  <tr
                    key={material.id}
                    className="hover:bg-steel-800/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-copper-400">
                      {material.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {material.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-steel-300">
                      {material.categoryName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                      {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
                      {material.standardPrice ? formatCurrency(material.standardPrice) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-steel-300">
                      {material.preferredVendorName ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          material.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {material.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedMaterial(material)}
                          className="text-sm text-steel-400 hover:text-white"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenOfferingsModal(material)}
                          className="flex items-center gap-1 text-sm text-copper-400 hover:text-copper-300"
                        >
                          <Icon name="building-office" className="h-4 w-4" />
                          Vendors
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel="materials"
              className="border-0 bg-transparent px-0"
            />
          )}
        </>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={true}
          onClose={handleCloseDetail}
          title={`Material: ${selectedMaterial.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-steel-500">SKU</label>
                <p className="font-mono text-copper-400">{selectedMaterial.sku}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Category</label>
                <p className="text-white">{selectedMaterial.categoryName}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Unit</label>
                <p className="text-white">{selectedMaterial.unit}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Standard Price</label>
                <p className="text-white">
                  {selectedMaterial.standardPrice ? formatCurrency(selectedMaterial.standardPrice) : '-'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase text-steel-500">Description</label>
                <p className="text-steel-300">
                  {selectedMaterial.description || 'No description'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase text-steel-500">Preferred Vendor</label>
                <p className="text-white">
                  {selectedMaterial.preferredVendorName ?? 'None'}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex justify-end gap-2 border-t border-steel-700/50 pt-4">
                <Button variant="secondary" onClick={handleOpenEdit}>
                  Edit
                </Button>
                <Button variant="danger" onClick={handleOpenDelete}>
                  Deactivate
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Vendor Offerings Modal */}
      {materialForOfferings && (
        <Modal
          isOpen={true}
          onClose={handleCloseOfferingsModal}
          title={`Vendors for "${materialForOfferings.name}"`}
          size="lg"
        >
          {offeringsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : offerings.length === 0 ? (
            <div className="py-8 text-center text-steel-400">
              <p>No vendors currently supply this material.</p>
              {canManage && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={handleOpenOfferingCreate}
                >
                  Add Vendor Offering
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
                        Vendor
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                        Lead Time
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                        Effective Period
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                        Preferred
                      </th>
                      {canManage && (
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                          Actions
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
                          {offering.leadTimeDays ? `${offering.leadTimeDays} days` : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                          {offering.effectiveFrom && offering.effectiveTo
                            ? `${offering.effectiveFrom} ~ ${offering.effectiveTo}`
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {offering.isPreferred ? (
                            <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                              Preferred
                            </span>
                          ) : canManage ? (
                            <button
                              onClick={() => handleSetPreferred(offering.id)}
                              className="text-xs text-steel-400 hover:text-amber-400"
                              disabled={setPreferredMutation.isPending}
                            >
                              Set as Preferred
                            </button>
                          ) : null}
                        </td>
                        {canManage && (
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenOfferingEdit(offering)}
                              className="text-sm text-steel-400 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenOfferingDelete(offering)}
                              className="ml-3 text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
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
                  <Button variant="secondary" onClick={handleOpenOfferingCreate}>
                    Add Vendor Offering
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Create/Edit Material Modal */}
      <MaterialFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        material={editingMaterial}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Material Modal */}
      <DeleteMaterialModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        material={deletingMaterial}
        onSuccess={handleDeleteSuccess}
      />

      {/* Vendor Material Offering Form Modal */}
      <VendorMaterialOfferingFormModal
        isOpen={isOfferingFormOpen}
        onClose={handleCloseOfferingForm}
        offering={editingOffering}
        materialId={materialForOfferings?.id}
        materialName={materialForOfferings?.name}
      />

      {/* Vendor Material Offering Delete Modal */}
      <DeleteVendorMaterialOfferingModal
        isOpen={isOfferingDeleteOpen}
        onClose={handleCloseOfferingDelete}
        offering={deletingOffering}
      />
    </div>
  );
}
