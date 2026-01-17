/**
 * Material Purchase Request Form Modal.
 *
 * Modal for creating a material purchase request from a task node.
 * Allows user to select a material and fill in request details.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, FormField, Modal, Spinner } from '@/shared/ui';
import { materialQueries, type MaterialListItem } from '@/entities/material';
import type { CreateMaterialPurchaseRequestInput } from '@/entities/purchase-request';
import { useCreateMaterialRequest } from '../model/use-create-material-request';

export interface MaterialRequestFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Project ID for the purchase request */
  projectId: number;
  /** Called after successful creation */
  onSuccess?: () => void;
}

interface FormState {
  categoryId: number | null;
  materialId: number | null;
  description: string;
  quantity: string;
  uom: string;
  requiredDate: string;
}

const initialFormState: FormState = {
  categoryId: null,
  materialId: null,
  description: '',
  quantity: '1',
  uom: '',
  requiredDate: '',
};

/**
 * Modal for creating a material purchase request from a task.
 */
export function MaterialRequestFormModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: Readonly<MaterialRequestFormModalProps>) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);

  // Fetch material categories for dropdown
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    ...materialQueries.categoryList(),
    enabled: isOpen,
  });

  // Fetch all materials for dropdown
  const { data: materials, isLoading: materialsLoading } = useQuery({
    ...materialQueries.allMaterials(),
    enabled: isOpen,
  });

  const createMutation = useCreateMaterialRequest({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || '구매 요청 생성에 실패했습니다');
    },
  });

  const handleClose = () => {
    setFormState(initialFormState);
    setError(null);
    onClose();
  };

  // When category is selected, reset material selection
  const handleCategoryChange = (categoryIdStr: string) => {
    const categoryId = categoryIdStr ? Number(categoryIdStr) : null;
    setFormState(s => ({
      ...s,
      categoryId,
      materialId: null, // Reset material when category changes
      uom: '', // Reset UOM when category changes
    }));
  };

  // When material is selected, auto-fill UOM
  const handleMaterialChange = (materialIdStr: string) => {
    const materialId = materialIdStr ? Number(materialIdStr) : null;
    const selectedMaterial = materials?.find((m: MaterialListItem) => m.id === materialId);

    setFormState(s => ({
      ...s,
      materialId,
      uom: selectedMaterial?.unit ?? s.uom,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formState.materialId) {
      setError('자재를 선택해주세요');
      return;
    }

    if (!formState.description.trim()) {
      setError('내용을 입력해주세요');
      return;
    }

    const quantity = parseFloat(formState.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('수량은 0보다 커야 합니다');
      return;
    }

    if (!formState.requiredDate) {
      setError('납기일을 선택해주세요');
      return;
    }

    const input: CreateMaterialPurchaseRequestInput = {
      materialId: formState.materialId,
      projectId,
      description: formState.description.trim(),
      quantity,
      uom: formState.uom.trim() || null,
      requiredDate: formState.requiredDate,
    };

    createMutation.mutate(input);
  };

  const activeCategories = categories?.filter(c => c.isActive) ?? [];

  // Filter materials: active only, and by category if selected
  const filteredMaterials = (materials ?? []).filter(m => {
    if (!m.isActive) return false;
    if (formState.categoryId !== null && m.categoryId !== formState.categoryId) return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="구매 요청" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-steel-300">자재 카테고리</label>
          {categoriesLoading ? (
            <div className="flex h-10 items-center justify-center rounded-lg border border-steel-700/50 bg-steel-900/60">
              <Spinner size="sm" />
            </div>
          ) : (
            <select
              value={formState.categoryId ?? ''}
              onChange={e => handleCategoryChange(e.target.value)}
              className="h-10 rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white focus:border-copper-500 focus:outline-none"
            >
              <option value="">전체 카테고리</option>
              {activeCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Material Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-steel-300">
            자재 <span className="text-red-400">*</span>
          </label>
          {materialsLoading ? (
            <div className="flex h-10 items-center justify-center rounded-lg border border-steel-700/50 bg-steel-900/60">
              <Spinner size="sm" />
            </div>
          ) : (
            <select
              value={formState.materialId ?? ''}
              onChange={e => handleMaterialChange(e.target.value)}
              className="h-10 rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white focus:border-copper-500 focus:outline-none"
              required
            >
              <option value="">자재 선택</option>
              {filteredMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  [{material.sku}] {material.name}
                  {formState.categoryId === null && ` (${material.categoryName})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-steel-300">
            내용 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formState.description}
            onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
            placeholder="구매 요청 내용을 입력하세요"
            rows={3}
            className="rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder:text-steel-500 focus:border-copper-500 focus:outline-none"
            required
          />
        </div>

        {/* Quantity and UOM */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="수량"
            value={formState.quantity}
            onChange={value => setFormState(s => ({ ...s, quantity: value }))}
            type="number"
            placeholder="1"
            required
          />
          <FormField
            label="단위"
            value={formState.uom}
            onChange={value => setFormState(s => ({ ...s, uom: value }))}
            placeholder="EA"
          />
        </div>

        {/* Required Date */}
        <DatePicker
          label="납기일"
          mode="single"
          value={formState.requiredDate}
          onChange={value => setFormState(s => ({ ...s, requiredDate: value as string }))}
          placeholder="납기일 선택"
          required
        />

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            구매 요청
          </Button>
        </div>
      </form>
    </Modal>
  );
}
