/**
 * Unit tests for Project Summary Service.
 * Tests the stub implementation with mock data generation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectSummaryService } from './projectSummaryService';

describe('projectSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjectSummary', () => {
    it('should return a ProjectSummary with all sections', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      expect(result).toBeDefined();
      expect(result.projectId).toBe(1);
      expect(result.sections).toHaveLength(6);
    });

    it('should include all required sections', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      const sectionNames = result.sections.map(s => s.section);
      expect(sectionNames).toContain('quotation');
      expect(sectionNames).toContain('process');
      expect(sectionNames).toContain('outsource');
      expect(sectionNames).toContain('delivery');
      expect(sectionNames).toContain('documents');
      expect(sectionNames).toContain('finance');
    });

    it('should have valid section summary structure', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      result.sections.forEach(section => {
        expect(section.section).toBeDefined();
        expect(section.label).toBeDefined();
        expect(typeof section.totalCount).toBe('number');
        expect(typeof section.pendingCount).toBe('number');
        expect(section.totalCount).toBeGreaterThanOrEqual(0);
        expect(section.pendingCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include progressPercent for process section', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      const processSection = result.sections.find(s => s.section === 'process');
      expect(processSection).toBeDefined();
      expect(processSection?.progressPercent).toBeDefined();
      expect(processSection?.progressPercent).toBeGreaterThanOrEqual(0);
      expect(processSection?.progressPercent).toBeLessThanOrEqual(100);
    });

    it('should include value for quotation section', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      const quotationSection = result.sections.find(s => s.section === 'quotation');
      expect(quotationSection).toBeDefined();
      expect(quotationSection?.value).toBeDefined();
      expect(quotationSection?.value).toBeGreaterThan(0);
    });

    it('should include value for finance section', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      const financeSection = result.sections.find(s => s.section === 'finance');
      expect(financeSection).toBeDefined();
      expect(financeSection?.value).toBeDefined();
      expect(financeSection?.value).toBeGreaterThan(0);
    });

    it('should have Korean labels for all sections', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      const expectedLabels: Record<string, string> = {
        quotation: '견적/결재',
        process: '공정/진행률',
        outsource: '외주',
        delivery: '납품',
        documents: '도면/문서',
        finance: '정산',
      };

      result.sections.forEach(section => {
        expect(section.label).toBe(expectedLabels[section.section]);
      });
    });

    it('should have valid lastUpdated timestamps', async () => {
      const result = await projectSummaryService.getProjectSummary(1);

      result.sections.forEach(section => {
        expect(section.lastUpdated).toBeDefined();
        // Should be a valid ISO date string
        const date = new Date(section.lastUpdated!);
        expect(date.getTime()).not.toBeNaN();
      });
    });

    it('should vary data based on projectId', async () => {
      const result1 = await projectSummaryService.getProjectSummary(1);
      const result2 = await projectSummaryService.getProjectSummary(6); // Different modulo result

      // Both should have valid data
      expect(result1.projectId).toBe(1);
      expect(result2.projectId).toBe(6);

      // The mock generates different values based on projectId % 5
      // projectId 1 -> multiplier 2, projectId 6 -> multiplier 2
      // Let's check with clearly different IDs
      const result3 = await projectSummaryService.getProjectSummary(2);
      expect(result1.sections[0].totalCount).not.toBe(result3.sections[0].totalCount);
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      await projectSummaryService.getProjectSummary(1);
      const elapsed = Date.now() - startTime;

      // Should have at least some delay (300ms minimum in the implementation)
      expect(elapsed).toBeGreaterThanOrEqual(100); // Allow some tolerance
    });
  });
});
