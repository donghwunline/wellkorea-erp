/**
 * Tests for project command validation.
 */

import { describe, expect, it } from 'vitest';
import { DomainValidationError } from '@/shared/api';
import { projectValidation, type CreateProjectCommand, type UpdateProjectCommand } from './project-command';

describe('projectValidation', () => {
  describe('validateCreate', () => {
    const validCommand: CreateProjectCommand = {
      customerId: 1,
      projectName: 'Test Project',
      requesterName: 'John Doe',
      dueDate: '2025-02-15',
      internalOwnerId: 1,
    };

    it('should pass for valid command', () => {
      expect(() => projectValidation.validateCreate(validCommand)).not.toThrow();
    });

    it('should throw for missing customerId', () => {
      const command = { ...validCommand, customerId: 0 };
      expect(() => projectValidation.validateCreate(command)).toThrow(DomainValidationError);
      expect(() => projectValidation.validateCreate(command)).toThrow('Customer is required');
    });

    it('should throw for empty projectName', () => {
      const command = { ...validCommand, projectName: '' };
      expect(() => projectValidation.validateCreate(command)).toThrow(DomainValidationError);
      expect(() => projectValidation.validateCreate(command)).toThrow('Project name is required');
    });

    it('should throw for whitespace-only projectName', () => {
      const command = { ...validCommand, projectName: '   ' };
      expect(() => projectValidation.validateCreate(command)).toThrow('Project name is required');
    });

    it('should throw for missing dueDate', () => {
      const command = { ...validCommand, dueDate: '' };
      expect(() => projectValidation.validateCreate(command)).toThrow('Due date is required');
    });

    it('should throw for invalid dueDate format', () => {
      const command = { ...validCommand, dueDate: '2025/02/15' };
      expect(() => projectValidation.validateCreate(command)).toThrow('Due date must be in YYYY-MM-DD format');
    });

    it('should throw for missing internalOwnerId', () => {
      const command = { ...validCommand, internalOwnerId: 0 };
      expect(() => projectValidation.validateCreate(command)).toThrow('Internal owner is required');
    });

    it('should allow null requesterName', () => {
      const command = { ...validCommand, requesterName: null };
      expect(() => projectValidation.validateCreate(command)).not.toThrow();
    });

    it('should include fieldPath in error', () => {
      const command = { ...validCommand, projectName: '' };
      try {
        projectValidation.validateCreate(command);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainValidationError);
        expect((error as DomainValidationError).fieldPath).toBe('projectName');
        expect((error as DomainValidationError).code).toBe('REQUIRED');
      }
    });
  });

  describe('validateUpdate', () => {
    it('should pass for valid partial update', () => {
      const command: UpdateProjectCommand = { projectName: 'Updated Name' };
      expect(() => projectValidation.validateUpdate(command)).not.toThrow();
    });

    it('should throw when no fields provided', () => {
      const command: UpdateProjectCommand = {};
      expect(() => projectValidation.validateUpdate(command)).toThrow(
        'At least one field must be provided for update'
      );
    });

    it('should throw for empty projectName when provided', () => {
      const command: UpdateProjectCommand = { projectName: '' };
      expect(() => projectValidation.validateUpdate(command)).toThrow('Project name cannot be empty');
    });

    it('should throw for invalid dueDate format when provided', () => {
      const command: UpdateProjectCommand = { dueDate: 'invalid-date' };
      expect(() => projectValidation.validateUpdate(command)).toThrow('Due date must be in YYYY-MM-DD format');
    });

    it('should allow valid status update', () => {
      const command: UpdateProjectCommand = { status: 'ACTIVE' };
      expect(() => projectValidation.validateUpdate(command)).not.toThrow();
    });

    it('should throw for invalid status', () => {
      const command: UpdateProjectCommand = { status: 'INVALID' as 'DRAFT' };
      expect(() => projectValidation.validateUpdate(command)).toThrow('Invalid project status');
    });

    it('should allow explicit null requesterName', () => {
      const command: UpdateProjectCommand = { requesterName: null };
      expect(() => projectValidation.validateUpdate(command)).not.toThrow();
    });

    it('should allow multiple fields in update', () => {
      const command: UpdateProjectCommand = {
        projectName: 'New Name',
        dueDate: '2025-03-01',
        status: 'COMPLETED',
      };
      expect(() => projectValidation.validateUpdate(command)).not.toThrow();
    });
  });
});
