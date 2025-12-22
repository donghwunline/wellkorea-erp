/**
 * Product catalog service.
 * Business logic layer for product search and retrieval.
 *
 * NOTE: This is a STUB service using mock data.
 * Replace with real API calls when backend endpoint is available.
 *
 * Expected backend endpoint: GET /api/products
 *
 * Features:
 * - Product search
 * - Product details
 */

import type { PaginatedProducts, ProductSearchParams, ProductSearchResult } from './types';

/**
 * Mock product data for industrial/manufacturing context.
 * TODO: Remove when backend /api/products endpoint is available.
 */
const MOCK_PRODUCTS: ProductSearchResult[] = [
  // CNC Machining Parts
  { id: 1, sku: 'CNC-AL-001', name: 'Aluminum CNC Bracket', description: 'Precision machined aluminum bracket for mounting', productTypeName: 'CNC Parts', baseUnitPrice: 45000, unit: 'EA', isActive: true },
  { id: 2, sku: 'CNC-SS-002', name: 'Stainless Steel Shaft', description: 'High-precision stainless steel rotating shaft', productTypeName: 'CNC Parts', baseUnitPrice: 78000, unit: 'EA', isActive: true },
  { id: 3, sku: 'CNC-BR-003', name: 'Brass Bushing Set', description: 'Custom machined brass bushing kit', productTypeName: 'CNC Parts', baseUnitPrice: 32000, unit: 'SET', isActive: true },

  // Sheet Metal Parts
  { id: 4, sku: 'SM-PANEL-001', name: 'Control Panel Enclosure', description: 'Powder-coated sheet metal enclosure', productTypeName: 'Sheet Metal', baseUnitPrice: 125000, unit: 'EA', isActive: true },
  { id: 5, sku: 'SM-BRKT-002', name: 'Heavy Duty Mounting Bracket', description: 'Galvanized steel mounting bracket', productTypeName: 'Sheet Metal', baseUnitPrice: 28000, unit: 'EA', isActive: true },
  { id: 6, sku: 'SM-COVER-003', name: 'Machine Cover Plate', description: 'Stainless steel protective cover', productTypeName: 'Sheet Metal', baseUnitPrice: 55000, unit: 'EA', isActive: true },

  // Laser Cut Parts
  { id: 7, sku: 'LC-PLATE-001', name: 'Precision Laser Cut Plate', description: 'Tight tolerance laser cut steel plate', productTypeName: 'Laser Cutting', baseUnitPrice: 35000, unit: 'EA', isActive: true },
  { id: 8, sku: 'LC-GASKET-002', name: 'Custom Gasket Set', description: 'Laser cut rubber gasket assembly', productTypeName: 'Laser Cutting', baseUnitPrice: 18000, unit: 'SET', isActive: true },

  // Welded Assemblies
  { id: 9, sku: 'WLD-FRAME-001', name: 'Steel Frame Assembly', description: 'Welded structural steel frame', productTypeName: 'Welding', baseUnitPrice: 280000, unit: 'EA', isActive: true },
  { id: 10, sku: 'WLD-CART-002', name: 'Industrial Cart Frame', description: 'Heavy duty welded cart chassis', productTypeName: 'Welding', baseUnitPrice: 195000, unit: 'EA', isActive: true },

  // Painting/Finishing
  { id: 11, sku: 'FIN-COAT-001', name: 'Powder Coating Service', description: 'Industrial powder coating per square meter', productTypeName: 'Finishing', baseUnitPrice: 15000, unit: 'M2', isActive: true },
  { id: 12, sku: 'FIN-ANOD-002', name: 'Aluminum Anodizing', description: 'Type II anodizing service', productTypeName: 'Finishing', baseUnitPrice: 22000, unit: 'M2', isActive: true },

  // Packaging
  { id: 13, sku: 'PKG-CRATE-001', name: 'Custom Wood Crate', description: 'Export-grade wooden shipping crate', productTypeName: 'Packaging', baseUnitPrice: 85000, unit: 'EA', isActive: true },
  { id: 14, sku: 'PKG-PALLET-002', name: 'Steel Pallet', description: 'Reusable steel shipping pallet', productTypeName: 'Packaging', baseUnitPrice: 120000, unit: 'EA', isActive: true },

  // Assembly
  { id: 15, sku: 'ASM-KIT-001', name: 'Hardware Assembly Kit', description: 'Complete fastener and hardware kit', productTypeName: 'Assembly', baseUnitPrice: 42000, unit: 'SET', isActive: true },
];

/**
 * Simulate API delay for realistic UX testing.
 */
function simulateDelay(ms: number = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Product catalog service with mock data.
 *
 * When backend is ready, replace implementation with:
 * ```typescript
 * import { httpClient, PRODUCT_ENDPOINTS } from '@/api';
 * import type { PagedResponse } from '@/api/types';
 * import { transformPagedResponse } from '@/services/shared';
 *
 * async searchProducts(params?: ProductSearchParams): Promise<PaginatedProducts> {
 *   const response = await httpClient.requestWithMeta<PagedResponse<ProductSearchResult>>({
 *     method: 'GET',
 *     url: PRODUCT_ENDPOINTS.BASE,
 *     params,
 *   });
 *   return transformPagedResponse(response.data, response.metadata);
 * }
 * ```
 */
export const productService = {
  /**
   * Search products.
   * Currently returns mock data.
   */
  async searchProducts(params?: ProductSearchParams): Promise<PaginatedProducts> {
    await simulateDelay();

    const { query, typeId, page = 0, size = 20 } = params ?? {};

    // Filter by search query (name or SKU)
    let filtered = MOCK_PRODUCTS.filter(p => p.isActive);
    if (query?.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    // Filter by product type ID (using simple mapping)
    if (typeId) {
      const typeMap: Record<number, string> = {
        1: 'CNC Parts',
        2: 'Sheet Metal',
        3: 'Laser Cutting',
        4: 'Welding',
        5: 'Finishing',
        6: 'Packaging',
        7: 'Assembly',
      };
      const typeName = typeMap[typeId];
      if (typeName) {
        filtered = filtered.filter(p => p.productTypeName === typeName);
      }
    }

    // Paginate
    const start = page * size;
    const end = start + size;
    const data = filtered.slice(start, end);

    return {
      data,
      pagination: {
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        first: page === 0,
        last: end >= filtered.length,
      },
    };
  },

  /**
   * Get product by ID.
   * Currently returns mock data.
   */
  async getProduct(id: number): Promise<ProductSearchResult> {
    await simulateDelay();

    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product not found with ID: ${id}`);
    }
    return product;
  },
};
