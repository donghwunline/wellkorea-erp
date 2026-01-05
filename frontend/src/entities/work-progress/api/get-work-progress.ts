/**
 * Work progress getter functions.
 *
 * HTTP GET operations for work progress data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, WORK_PROGRESS_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type {
  WorkProgressSheetResponse,
  WorkProgressStepResponse,
  ProjectProductionSummaryResponse,
} from './work-progress.mapper';

/**
 * Parameters for getting work progress sheets.
 */
export interface GetSheetsParams {
  projectId?: number;
  page: number;
  size: number;
}

/**
 * Get work progress sheets (paginated).
 * If projectId is provided, returns sheets for that project only.
 * If projectId is not provided, returns all sheets across all projects.
 *
 * @param params - Query parameters
 * @returns PagedResponse (Spring Page structure) of work progress sheet responses
 */
export async function getWorkProgressSheets(
  params: GetSheetsParams
): Promise<PagedResponse<WorkProgressSheetResponse>> {
  return httpClient.get<PagedResponse<WorkProgressSheetResponse>>(WORK_PROGRESS_ENDPOINTS.BASE, { params });
}

/**
 * Get a single work progress sheet by ID (with steps).
 *
 * @param id - Sheet ID
 * @returns Work progress sheet response
 */
export async function getWorkProgressSheet(id: number): Promise<WorkProgressSheetResponse> {
  return httpClient.get<WorkProgressSheetResponse>(WORK_PROGRESS_ENDPOINTS.byId(id));
}

/**
 * Get project production summary.
 *
 * @param projectId - Project ID
 * @returns Project production summary response
 */
export async function getProjectSummary(
  projectId: number
): Promise<ProjectProductionSummaryResponse> {
  return httpClient.get<ProjectProductionSummaryResponse>(
    WORK_PROGRESS_ENDPOINTS.projectSummary(projectId)
  );
}

/**
 * Get outsourced steps for a project.
 *
 * @param projectId - Project ID
 * @returns List of outsourced step responses
 */
export async function getOutsourcedSteps(projectId: number): Promise<WorkProgressStepResponse[]> {
  return httpClient.get<WorkProgressStepResponse[]>(
    WORK_PROGRESS_ENDPOINTS.outsourcedSteps(projectId)
  );
}
