/**
 * Product Combobox.
 *
 * Entity selector component for choosing a product.
 * Uses async loading with the product search API.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives value and delegates changes via props
 */

import { useCallback } from 'react';
import { Combobox, type ComboboxOption } from '@/shared/ui';
import { searchProductsApi, type SearchProductsResult } from '../api/search-products';

export interface ProductComboboxProps {
  /**
   * Selected product ID, or null if nothing selected.
   */
  value: number | null;

  /**
   * Callback fired when selection changes.
   */
  onChange: (productId: number | null) => void;

  /**
   * Whether to show only active products.
   * @default true
   */
  activeOnly?: boolean;

  /**
   * Field label.
   */
  label?: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Initial display label for the selected product.
   * Used when value is pre-selected but options haven't loaded.
   */
  initialLabel?: string | null;

  /**
   * Whether the field is required.
   */
  required?: boolean;

  /**
   * Whether the field is disabled.
   */
  disabled?: boolean;

  /**
   * Error message.
   */
  error?: string;

  /**
   * Help text shown below the input.
   */
  helpText?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Product selector combobox with async search.
 *
 * @example
 * ```tsx
 * <ProductCombobox
 *   value={formData.productId}
 *   onChange={(id) => setFormData({ ...formData, productId: id })}
 *   label="Product"
 *   required
 * />
 * ```
 */
export function ProductCombobox({
  value,
  onChange,
  activeOnly = true,
  label,
  placeholder = 'Search products...',
  initialLabel,
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<ProductComboboxProps>) {
  /**
   * Load products from API based on search query.
   */
  const loadOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const result: SearchProductsResult = await searchProductsApi({
        query: query || '',
        activeOnly,
        limit: 20,
      });

      return result.data.map(product => ({
        id: product.id,
        label: `[${product.sku}] ${product.name}`,
        description: product.productTypeName,
      }));
    },
    [activeOnly]
  );

  /**
   * Handle selection change.
   * Convert to number (Combobox uses string | number).
   */
  const handleChange = useCallback(
    (id: string | number | null) => {
      onChange(id === null ? null : Number(id));
    },
    [onChange]
  );

  return (
    <Combobox
      value={value}
      onChange={handleChange}
      loadOptions={loadOptions}
      label={label}
      placeholder={placeholder}
      initialLabel={initialLabel ?? undefined}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
      noResultsText="No products found"
      loadingText="Loading..."
    />
  );
}
