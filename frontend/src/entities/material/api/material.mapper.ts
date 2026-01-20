/**
 * Material API Response Types and Mappers.
 *
 * INTERNAL: This file is NOT exported from the entity public API.
 * Response types and mappers are implementation details.
 */

import type { Material, MaterialListItem } from '../model/material';
import type { MaterialCategory, MaterialCategoryListItem } from '../model/material-category';
import type { VendorMaterialOffering } from '../model/vendor-material-offering';

// =============================================================================
// MATERIAL RESPONSE TYPES (Backend DTO shapes)
// =============================================================================

export interface MaterialResponse {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  unit: string;
  standardPrice: number | null;
  preferredVendorId: number | null;
  preferredVendorName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialCategoryResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  materialCount: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// MAPPERS (Response DTO → Domain Model)
// =============================================================================

/**
 * Map material response to domain model.
 */
export function mapMaterial(response: MaterialResponse): Material {
  return {
    id: response.id,
    sku: response.sku,
    name: response.name,
    description: response.description,
    categoryId: response.categoryId,
    categoryName: response.categoryName,
    unit: response.unit,
    standardPrice: response.standardPrice,
    preferredVendorId: response.preferredVendorId,
    preferredVendorName: response.preferredVendorName,
    isActive: response.active,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

/**
 * Map material response to list item.
 */
export function mapMaterialListItem(response: MaterialResponse): MaterialListItem {
  return {
    id: response.id,
    sku: response.sku,
    name: response.name,
    description: response.description,
    categoryId: response.categoryId,
    categoryName: response.categoryName,
    unit: response.unit,
    standardPrice: response.standardPrice,
    preferredVendorId: response.preferredVendorId,
    preferredVendorName: response.preferredVendorName,
    isActive: response.active,
  };
}

/**
 * Map material category response to domain model.
 */
export function mapMaterialCategory(response: MaterialCategoryResponse): MaterialCategory {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    isActive: response.active,
    materialCount: response.materialCount,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

/**
 * Map material category response to list item.
 */
export function mapMaterialCategoryListItem(response: MaterialCategoryResponse): MaterialCategoryListItem {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    isActive: response.active,
    materialCount: response.materialCount,
  };
}

// =============================================================================
// VENDOR MATERIAL OFFERING RESPONSE TYPES
// =============================================================================

/**
 * Vendor material offering response from API.
 */
export interface VendorMaterialOfferingResponse {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorEmail?: string | null;
  materialId: number;
  materialName: string;
  materialSku: string;
  vendorMaterialCode?: string | null;
  vendorMaterialName?: string | null;
  unitPrice?: number | null;
  currency: string;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VENDOR MATERIAL OFFERING MAPPERS
// =============================================================================

/**
 * Map vendor material offering response to domain model.
 */
export function mapVendorMaterialOffering(response: VendorMaterialOfferingResponse): VendorMaterialOffering {
  return {
    id: response.id,
    vendorId: response.vendorId,
    vendorName: response.vendorName,
    vendorEmail: response.vendorEmail ?? null,
    materialId: response.materialId,
    materialName: response.materialName,
    materialSku: response.materialSku,
    vendorMaterialCode: response.vendorMaterialCode ?? null,
    vendorMaterialName: response.vendorMaterialName ?? null,
    unitPrice: response.unitPrice ?? null,
    currency: response.currency,
    leadTimeDays: response.leadTimeDays ?? null,
    minOrderQuantity: response.minOrderQuantity ?? null,
    effectiveFrom: response.effectiveFrom ?? null,
    effectiveTo: response.effectiveTo ?? null,
    isPreferred: response.isPreferred,
    notes: response.notes ?? null,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}
