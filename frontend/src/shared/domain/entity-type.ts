/**
 * Entity type enum and display configuration.
 *
 * Defines the types of entities that can require approval.
 * Shared between approval and approval-chain entities.
 */

/**
 * Entity types that support approval workflow.
 * Const object pattern provides both type safety and runtime values.
 */
export const EntityType = {
  QUOTATION: 'QUOTATION',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

/**
 * Entity type display configuration.
 */
export interface EntityTypeConfig {
  readonly label: string;
  readonly labelKo: string;
}

/**
 * Display configuration for each entity type.
 */
export const EntityTypeConfigs: Record<EntityType, EntityTypeConfig> = {
  QUOTATION: { label: 'Quotation', labelKo: '견적서' },
  PURCHASE_ORDER: { label: 'Purchase Order', labelKo: '발주서' },
};

/**
 * Get entity type label for display.
 *
 * @param type - Entity type
 * @param korean - Use Korean label (default: true)
 */
export function getEntityTypeLabel(type: EntityType, korean = true): string {
  const config = EntityTypeConfigs[type];
  return korean ? config.labelKo : config.label;
}
