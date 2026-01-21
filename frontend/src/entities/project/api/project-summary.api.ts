/**
 * Project Summary API.
 *
 * Provides summary statistics for project sections (tab badge counts).
 *
 * FSD Layer: entities/project/api
 */

import type { ProjectSectionsSummary, ProjectKPI } from '../model/project';
import { httpClient, PROJECT_ENDPOINTS } from '@/shared/api';

// ============================================================================
// Response Types (internal - not exported)
// ============================================================================

/**
 * Backend response for project section summary.
 */
interface ProjectSectionSummaryResponse {
  section: string;
  label: string;
  totalCount: number;
  pendingCount: number;
  progressPercent: number | null;
  value: number | null;
  lastUpdated: string | null;
}

/**
 * Backend response for project sections summary.
 */
interface ProjectSectionsSummaryResponse {
  projectId: number;
  sections: ProjectSectionSummaryResponse[];
}

// ============================================================================
// Mappers (internal - not exported)
// ============================================================================

/**
 * Map backend response to domain model.
 */
function mapSummaryResponse(response: ProjectSectionsSummaryResponse): ProjectSectionsSummary {
  return {
    projectId: response.projectId,
    sections: response.sections.map(section => ({
      section: section.section as ProjectSectionsSummary['sections'][0]['section'],
      label: section.label,
      totalCount: section.totalCount,
      pendingCount: section.pendingCount,
      progressPercent: section.progressPercent ?? undefined,
      value: section.value ?? undefined,
      lastUpdated: section.lastUpdated,
    })),
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Project summary API.
 */
export const projectSummaryApi = {
  /**
   * Fetch project summary statistics (tab badge counts).
   *
   * @param projectId - The project ID
   * @returns Promise resolving to project sections summary
   */
  async getSummary(projectId: number): Promise<ProjectSectionsSummary> {
    const response = await httpClient.get<ProjectSectionsSummaryResponse>(
      PROJECT_ENDPOINTS.summary(projectId)
    );
    return mapSummaryResponse(response);
  },

  /**
   * Fetch project KPI statistics.
   *
   * @param projectId - The project ID
   * @returns Promise resolving to project KPIs
   */
  async getKPIs(projectId: number): Promise<ProjectKPI> {
    return httpClient.get<ProjectKPI>(PROJECT_ENDPOINTS.kpi(projectId));
  },
};
