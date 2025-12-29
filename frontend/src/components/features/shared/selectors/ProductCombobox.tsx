/**
 * ProductCombobox - Reusable Product Selector Component
 *
 * A specialized Combobox for selecting products.
 * Encapsulates productService calls and provides consistent product selection UI.
 *
 * Usage:
 * ```tsx
 * <ProductCombobox
 *   value={selectedProductId}
 *   onChange={handleProductSelect}
 *   label="Product"
 * />
 * ```
 */

import { useCallback } from 'react';
import { productService } from '@/services';
import { Combobox, type ComboboxOption } from '@/components/ui';

export interface ProductComboboxProps {
  /** Currently selected product ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (productId: number | null) => void;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Product selector component that wraps Combobox with productService.
 */
export function ProductCombobox({
  value,
  onChange,
  label,
  placeholder = 'Search by name or SKU...',
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<ProductComboboxProps>) {
  /**
   * Load products from API based on search query.
   * Transforms ProductSearchResult to ComboboxOption format.
   */
  const loadProducts = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await productService.searchProducts({
      query,
      page: 0,
      size: 20,
    });

    return result.data.map(product => ({
      id: product.id,
      label: product.name,
      description: `${product.sku}${product.productTypeName ? ` | ${product.productTypeName}` : ''}`,
    }));
  }, []);

  /**
   * Handle selection change.
   * Converts ComboboxOption to product ID.
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
      loadOptions={loadProducts}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
    />
  );
}
