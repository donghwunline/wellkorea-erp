/**
 * Tests for project command mapper.
 */

import { describe, expect, it } from 'vitest';
import {
  projectCommandMapper,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './project.command-mapper';

describe('projectCommandMapper', () => {
  describe('toCreateCommand', () => {
    const validInput: CreateProjectInput = {
      customerId: 1,
      projectName: 'Test Project',
      requesterName: 'John Doe',
      dueDate: '2025-02-15',
      internalOwnerId: 2,
    };

    it('should map valid input to command', () => {
      const command = projectCommandMapper.toCreateCommand(validInput);

      expect(command).toEqual({
        customerId: 1,
        projectName: 'Test Project',
        requesterName: 'John Doe',
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      });
    });

    it('should trim projectName', () => {
      const input = { ...validInput, projectName: '  Trimmed Name  ' };
      const command = projectCommandMapper.toCreateCommand(input);

      expect(command.projectName).toBe('Trimmed Name');
    });

    it('should trim requesterName', () => {
      const input = { ...validInput, requesterName: '  Trimmed Requester  ' };
      const command = projectCommandMapper.toCreateCommand(input);

      expect(command.requesterName).toBe('Trimmed Requester');
    });

    it('should convert empty requesterName to null', () => {
      const input = { ...validInput, requesterName: '' };
      const command = projectCommandMapper.toCreateCommand(input);

      expect(command.requesterName).toBeNull();
    });

    it('should convert whitespace-only requesterName to null', () => {
      const input = { ...validInput, requesterName: '   ' };
      const command = projectCommandMapper.toCreateCommand(input);

      expect(command.requesterName).toBeNull();
    });

    it('should throw for null customerId', () => {
      const input = { ...validInput, customerId: null };
      expect(() => projectCommandMapper.toCreateCommand(input)).toThrow('Customer is required');
    });

    it('should throw for null internalOwnerId', () => {
      const input = { ...validInput, internalOwnerId: null };
      expect(() => projectCommandMapper.toCreateCommand(input)).toThrow('Internal owner is required');
    });

    it('should handle undefined requesterName', () => {
      const input: CreateProjectInput = {
        customerId: 1,
        projectName: 'Test',
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      };
      const command = projectCommandMapper.toCreateCommand(input);

      expect(command.requesterName).toBeNull();
    });
  });

  describe('toUpdateCommand', () => {
    it('should map valid input to command', () => {
      const input: UpdateProjectInput = {
        projectName: 'Updated Name',
        dueDate: '2025-03-01',
      };
      const command = projectCommandMapper.toUpdateCommand(input);

      expect(command).toEqual({
        projectName: 'Updated Name',
        requesterName: undefined,
        dueDate: '2025-03-01',
        status: undefined,
      });
    });

    it('should trim projectName', () => {
      const input: UpdateProjectInput = { projectName: '  Trimmed  ' };
      const command = projectCommandMapper.toUpdateCommand(input);

      expect(command.projectName).toBe('Trimmed');
    });

    it('should convert empty requesterName to null', () => {
      const input: UpdateProjectInput = { requesterName: '' };
      const command = projectCommandMapper.toUpdateCommand(input);

      expect(command.requesterName).toBeNull();
    });

    it('should preserve undefined requesterName as undefined', () => {
      const input: UpdateProjectInput = { projectName: 'Test' };
      const command = projectCommandMapper.toUpdateCommand(input);

      expect(command.requesterName).toBeUndefined();
    });

    it('should map status correctly', () => {
      const input: UpdateProjectInput = { status: 'COMPLETED' };
      const command = projectCommandMapper.toUpdateCommand(input);

      expect(command.status).toBe('COMPLETED');
    });
  });

  describe('toCreateDto', () => {
    it('should map command to DTO', () => {
      const command = {
        customerId: 1,
        projectName: 'Test Project',
        requesterName: 'John Doe',
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      };
      const dto = projectCommandMapper.toCreateDto(command);

      expect(dto).toEqual({
        customerId: 1,
        projectName: 'Test Project',
        requesterName: 'John Doe',
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      });
    });

    it('should convert null requesterName to undefined for API', () => {
      const command = {
        customerId: 1,
        projectName: 'Test',
        requesterName: null,
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      };
      const dto = projectCommandMapper.toCreateDto(command);

      expect(dto.requesterName).toBeUndefined();
    });
  });

  describe('toUpdateDto', () => {
    it('should map command to DTO', () => {
      const command = {
        projectName: 'Updated',
        dueDate: '2025-03-01',
        status: 'ACTIVE' as const,
      };
      const dto = projectCommandMapper.toUpdateDto(command);

      expect(dto).toEqual({
        projectName: 'Updated',
        requesterName: undefined,
        dueDate: '2025-03-01',
        status: 'ACTIVE',
      });
    });

    it('should convert null requesterName to undefined for API', () => {
      const command = {
        requesterName: null,
      };
      const dto = projectCommandMapper.toUpdateDto(command);

      expect(dto.requesterName).toBeUndefined();
    });
  });
});
