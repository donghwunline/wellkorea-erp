/**
 * Product Selector Types.
 *
 * Shared types for the product selection component.
 */

/**
 * Line item data structure for product selector.
 * Contains product info and pricing for display and form submission.
 */
export interface ProductLineItem {
  /**
   * Product ID.
   */
  productId: number;

  /**
   * Product name for display.
   */
  productName: string;

  /**
   * Product SKU for display.
   */
  productSku: string;

  /**
   * Quantity of the product.
   */
  quantity: number;

  /**
   * Unit price in KRW.
   */
  unitPrice: number;

  /**
   * Optional notes for the line item.
   */
  notes?: string;
}

/**
 * Props for ProductSelector component.
 */
export interface ProductSelectorProps {
  /**
   * Current line items with display names.
   */
  lineItems: ProductLineItem[];

  /**
   * Called when line items change.
   */
  onChange: (lineItems: ProductLineItem[]) => void;

  /**
   * Whether the selector is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS class names.
   */
  className?: string;
}
