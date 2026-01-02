/**
 * Product Mapper.
 *
 * Internal module for mapping between DTOs and domain models.
 * This should NOT be exported from the entity barrel.
 */

import type { Product, ProductListItem } from '../model/product';
import type { ProductType } from '../model/product-type';
import type {
  ProductDetailResponse,
  ProductSummaryResponse,
  ProductTypeResponse,
} from './product.dto';

/**
 * Product mapper functions.
 */
export const productMapper = {
  /**
   * Map product detail response to domain model.
   */
  toDomain(dto: ProductDetailResponse): Product {
    return {
      id: dto.id,
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      productTypeId: dto.productTypeId,
      productTypeName: dto.productTypeName,
      baseUnitPrice: dto.baseUnitPrice ?? null,
      unit: dto.unit,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },

  /**
   * Map product summary response to list item.
   */
  toListItem(dto: ProductSummaryResponse): ProductListItem {
    return {
      id: dto.id,
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      productTypeId: dto.productTypeId,
      productTypeName: dto.productTypeName,
      baseUnitPrice: dto.baseUnitPrice ?? null,
      unit: dto.unit,
      isActive: dto.isActive,
    };
  },
};

/**
 * ProductType mapper functions.
 */
export const productTypeMapper = {
  /**
   * Map product type response to domain model.
   */
  toDomain(dto: ProductTypeResponse): ProductType {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? null,
      createdAt: dto.createdAt,
    };
  },
};
