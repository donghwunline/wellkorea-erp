/**
 * Project Summary Service
 *
 * Provides summary statistics for project-related sections (quotation, process, etc.).
 * Currently uses stub implementation with mock data.
 *
 * Migration to real API:
 * 1. Implement backend endpoint: GET /projects/:id/summary
 * 2. Replace stub functions with httpClient calls
 * 3. Ensure response matches ProjectSummary interface
 */

import type { ProjectSummary, ProjectSectionSummary, ProjectKPI } from './types';

// ============================================================================
// Stub Implementation (Mock Data)
// ============================================================================

/**
 * Simulate network delay.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate mock summary data for a project.
 * Returns realistic data that demonstrates the UI.
 */
function generateMockSummary(projectId: number): ProjectSummary {
  // Use projectId to create slight variations in mock data
  const baseMultiplier = (projectId % 5) + 1;

  const sections: ProjectSectionSummary[] = [
    {
      section: 'quotation',
      label: '견적/결재',
      totalCount: baseMultiplier,
      pendingCount: Math.max(0, baseMultiplier - 2),
      value: 15000000 * baseMultiplier,
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      section: 'process',
      label: '공정/진행률',
      totalCount: 6, // 6 production processes
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

  return {
    projectId,
    sections,
  };
}

// ============================================================================
// Service API
// ============================================================================

/**
 * Fetch project summary statistics.
 *
 * @param projectId - The project ID to fetch summary for
 * @returns Promise resolving to project summary
 *
 * @example
 * ```typescript
 * const summary = await projectSummaryService.getProjectSummary(123);
 * console.log(summary.sections[0].totalCount);
 * ```
 */
async function getProjectSummary(projectId: number): Promise<ProjectSummary> {
  // Simulate network delay (300-500ms)
  await delay(300 + Math.random() * 200);

  // Return mock data (replace with real API call when backend is ready)
  // Example real implementation:
  // return httpClient.get<ProjectSummary>(PROJECT_ENDPOINTS.summary(projectId));
  return generateMockSummary(projectId);
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

/**
 * Fetch project KPI statistics.
 *
 * @param projectId - The project ID to fetch KPIs for
 * @returns Promise resolving to project KPIs
 */
async function getProjectKPIs(projectId: number): Promise<ProjectKPI> {
  // Simulate network delay (200-400ms)
  await delay(200 + Math.random() * 200);

  // Return mock data (replace with real API call when backend is ready)
  // Example real implementation:
  // return httpClient.get<ProjectKPI>(PROJECT_ENDPOINTS.kpis(projectId));
  return generateMockKPI(projectId);
}

export const projectSummaryService = {
  getProjectSummary,
  getProjectKPIs,
};
