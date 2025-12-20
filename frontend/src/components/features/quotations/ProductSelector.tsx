/**
 * Product Selector - Feature Component
 *
 * Responsibilities:
 * - Search products using productService
 * - Allow selection and adding with quantity/price
 * - Manage line items for quotation forms
 *
 * This component owns Server State (Tier 3) for product search.
 */

import { useCallback, useState } from 'react';
import { productService } from '@/services';
import type { LineItemRequest } from '@/services';
import {
  Button,
  Card,
  Combobox,
  type ComboboxOption,
  FormField,
  Icon,
  IconButton,
  Input,
  Table,
} from '@/components/ui';

export interface ProductSelectorProps {
  /** Current line items */
  lineItems: LineItemRequest[];
  /** Called when line items change */
  onChange: (lineItems: LineItemRequest[]) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
}

interface SelectedProduct {
  productId: number;
  name: string;
  sku: string;
  unit: string | null;
  unitPrice: number;
  quantity: number;
}

/**
 * Product selector with search and line item management.
 */
export function ProductSelector({
  lineItems,
  onChange,
  disabled = false,
}: Readonly<ProductSelectorProps>) {
  // Local state for new product being added
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Load products for combobox
  const loadProducts = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await productService.searchProducts({
      search: query,
      page: 0,
      size: 20,
    });
    return result.data.map(product => ({
      id: product.id,
      label: product.name,
      description: `${product.sku}${product.productTypeName ? ` | ${product.productTypeName}` : ''}`,
    }));
  }, []);

  // Handle product selection from combobox
  const handleProductSelect = useCallback(
    async (value: string | number | null) => {
      if (value === null) {
        setSelectedProductId(null);
        setSelectedProduct(null);
        setUnitPrice('');
        return;
      }

      const productId = Number(value);
      setSelectedProductId(productId);

      // Fetch full product details
      const product = await productService.getProduct(productId);
      setSelectedProduct({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        unitPrice: product.unitPrice,
        quantity: 1,
      });
      setUnitPrice(product.unitPrice.toString());
    },
    []
  );

  // Add selected product to line items
  const handleAddProduct = useCallback(() => {
    if (!selectedProduct) return;

    const parsedQuantity = parseInt(quantity, 10);
    const parsedUnitPrice = parseFloat(unitPrice);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) return;
    if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) return;

    const newLineItem: LineItemRequest = {
      productId: selectedProduct.productId,
      quantity: parsedQuantity,
      unitPrice: parsedUnitPrice,
      note: note.trim() || undefined,
    };

    onChange([...lineItems, newLineItem]);

    // Reset form
    setSelectedProductId(null);
    setSelectedProduct(null);
    setQuantity('1');
    setUnitPrice('');
    setNote('');
  }, [selectedProduct, quantity, unitPrice, note, lineItems, onChange]);

  // Remove line item
  const handleRemoveItem = useCallback(
    (index: number) => {
      const updated = lineItems.filter((_, i) => i !== index);
      onChange(updated);
    },
    [lineItems, onChange]
  );

  // Update line item quantity
  const handleQuantityChange = useCallback(
    (index: number, newQuantity: string) => {
      const parsed = parseInt(newQuantity, 10);
      if (isNaN(parsed) || parsed <= 0) return;

      const updated = lineItems.map((item, i) =>
        i === index ? { ...item, quantity: parsed } : item
      );
      onChange(updated);
    },
    [lineItems, onChange]
  );

  // Update line item unit price
  const handleUnitPriceChange = useCallback(
    (index: number, newPrice: string) => {
      const parsed = parseFloat(newPrice);
      if (isNaN(parsed) || parsed < 0) return;

      const updated = lineItems.map((item, i) =>
        i === index ? { ...item, unitPrice: parsed } : item
      );
      onChange(updated);
    },
    [lineItems, onChange]
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total
  const totalAmount = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const canAdd = selectedProduct && parseInt(quantity, 10) > 0 && parseFloat(unitPrice) >= 0;

  return (
    <div className="space-y-4">
      {/* Product Search Form */}
      {!disabled && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Product Search */}
            <div className="md:col-span-5">
              <Combobox
                value={selectedProductId}
                onChange={handleProductSelect}
                loadOptions={loadProducts}
                label="Search Product"
                placeholder="Search by name or SKU..."
                disabled={disabled}
              />
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <FormField label="Quantity" required>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  disabled={disabled || !selectedProduct}
                />
              </FormField>
            </div>

            {/* Unit Price */}
            <div className="md:col-span-2">
              <FormField label="Unit Price (KRW)" required>
                <Input
                  type="number"
                  min="0"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  disabled={disabled || !selectedProduct}
                />
              </FormField>
            </div>

            {/* Note */}
            <div className="md:col-span-2">
              <FormField label="Note">
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional"
                  disabled={disabled || !selectedProduct}
                />
              </FormField>
            </div>

            {/* Add Button */}
            <div className="flex items-end md:col-span-1">
              <Button
                onClick={handleAddProduct}
                disabled={disabled || !canAdd}
                className="w-full"
              >
                <Icon name="plus" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Product Info */}
          {selectedProduct && (
            <div className="mt-3 rounded-lg bg-steel-800/50 p-3">
              <div className="text-sm">
                <span className="text-steel-400">Selected: </span>
                <span className="font-medium text-white">{selectedProduct.name}</span>
                <span className="ml-2 text-steel-400">({selectedProduct.sku})</span>
                {selectedProduct.unit && (
                  <span className="ml-2 text-steel-500">Unit: {selectedProduct.unit}</span>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Line Items Table */}
      {lineItems.length > 0 && (
        <Card variant="table">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-8">#</Table.HeaderCell>
                <Table.HeaderCell>Product</Table.HeaderCell>
                <Table.HeaderCell className="w-24 text-right">Qty</Table.HeaderCell>
                <Table.HeaderCell className="w-32 text-right">Unit Price</Table.HeaderCell>
                <Table.HeaderCell className="w-32 text-right">Amount</Table.HeaderCell>
                <Table.HeaderCell className="w-32">Note</Table.HeaderCell>
                {!disabled && <Table.HeaderCell className="w-12" />}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {lineItems.map((item, index) => (
                <Table.Row key={index}>
                  <Table.Cell className="text-steel-400">{index + 1}</Table.Cell>
                  <Table.Cell>
                    <span className="text-white">Product #{item.productId}</span>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {disabled ? (
                      <span className="text-steel-300">{item.quantity}</span>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(index, e.target.value)}
                        className="w-20 text-right"
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {disabled ? (
                      <span className="text-steel-300">{formatCurrency(item.unitPrice)}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={e => handleUnitPriceChange(index, e.target.value)}
                        className="w-28 text-right"
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right text-white">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </Table.Cell>
                  <Table.Cell className="text-steel-400 text-sm">
                    {item.note || '-'}
                  </Table.Cell>
                  {!disabled && (
                    <Table.Cell>
                      <IconButton
                        onClick={() => handleRemoveItem(index)}
                        variant="danger"
                        aria-label="Remove item"
                        title="Remove item"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </IconButton>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Total */}
          <div className="border-t border-steel-700/50 px-4 py-3">
            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-steel-400">Total Amount: </span>
                <span className="text-lg font-semibold text-copper-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {lineItems.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name="shopping-cart" className="mx-auto h-12 w-12 text-steel-600" />
          <p className="mt-4 text-steel-400">No products added yet.</p>
          <p className="mt-1 text-sm text-steel-500">
            Search and add products to create your quotation.
          </p>
        </Card>
      )}
    </div>
  );
}
