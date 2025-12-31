/**
 * Project Summary API (Stub Implementation).
 *
 * Provides summary statistics for project sections.
 * Currently uses mock data - will be replaced with real API when backend is ready.
 *
 * FSD Layer: entities/project/api
 */

import type { ProjectSectionSummary, ProjectSectionsSummary, ProjectKPI } from '../model';

// ============================================================================
// Stub Implementation (Mock Data)
// ============================================================================

/**
 * Simulate network delay.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate mock summary data for a project.
 */
function generateMockSummary(projectId: number): ProjectSectionsSummary {
  const baseMultiplier = (projectId % 5) + 1;

  const sections: ProjectSectionSummary[] = [
    {
      section: 'quotation',
      label: '견적',
      totalCount: baseMultiplier,
      pendingCount: Math.max(0, baseMultiplier - 2),
      value: 15000000 * baseMultiplier,
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'process',
      label: '공정/진행률',
      totalCount: 6,
      pendingCount: Math.min(6, baseMultiplier),
      progressPercent: Math.min(100, 20 * baseMultiplier),
      lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'outsource',
      label: '외주',
      totalCount: baseMultiplier + 1,
      pendingCount: Math.max(0, baseMultiplier - 1),
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'delivery',
      label: '납품',
      totalCount: baseMultiplier * 2,
      pendingCount: baseMultiplier,
      lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'documents',
      label: '도면/문서',
      totalCount: baseMultiplier * 3,
      pendingCount: 0,
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'finance',
      label: '정산',
      totalCount: baseMultiplier,
      pendingCount: Math.max(0, baseMultiplier - 1),
      value: 12000000 * baseMultiplier,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return { projectId, sections };
}

/**
 * Generate mock KPI data for a project.
 */
function generateMockKPI(projectId: number): ProjectKPI {
  const baseMultiplier = (projectId % 5) + 1;

  return {
    progressPercent: Math.min(100, 20 * baseMultiplier),
    pendingApprovals: Math.max(0, baseMultiplier - 2),
    missingDocuments: baseMultiplier > 2 ? 1 : 0,
    accountsReceivable: 5000000 * baseMultiplier,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Project summary API (stub).
 */
export const projectSummaryApi = {
  /**
   * Fetch project summary statistics.
   *
   * @param projectId - The project ID
   * @returns Promise resolving to project sections summary
   */
  async getSummary(projectId: number): Promise<ProjectSectionsSummary> {
    // Simulate network delay (300-500ms)
    await delay(300 + Math.random() * 200);

    // Replace with real API call when backend is ready:
    // return httpClient.get<ProjectSectionsSummary>(PROJECT_ENDPOINTS.summary(projectId));
    return generateMockSummary(projectId);
  },

  /**
   * Fetch project KPI statistics.
   *
   * @param projectId - The project ID
   * @returns Promise resolving to project KPIs
   */
  async getKPIs(projectId: number): Promise<ProjectKPI> {
    // Simulate network delay (200-400ms)
    await delay(200 + Math.random() * 200);

    // Replace with real API call when backend is ready:
    // return httpClient.get<ProjectKPI>(PROJECT_ENDPOINTS.kpis(projectId));
    return generateMockKPI(projectId);
  },
};
