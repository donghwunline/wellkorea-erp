/**
 * Chain Template getter functions.
 *
 * HTTP GET operations for chain template data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, APPROVAL_CHAIN_ENDPOINTS } from '@/shared/api';
import type { ChainTemplateResponse } from './chain-template.mapper';

/**
 * Get all approval chain templates.
 *
 * @returns Array of chain template responses
 */
export async function getChainTemplates(): Promise<ChainTemplateResponse[]> {
  return httpClient.get<ChainTemplateResponse[]>(APPROVAL_CHAIN_ENDPOINTS.BASE);
}

/**
 * Get a single chain template by ID.
 *
 * @param id - Chain template ID
 * @returns Raw chain template response
 */
export async function getChainTemplate(id: number): Promise<ChainTemplateResponse> {
  return httpClient.get<ChainTemplateResponse>(APPROVAL_CHAIN_ENDPOINTS.byId(id));
}
