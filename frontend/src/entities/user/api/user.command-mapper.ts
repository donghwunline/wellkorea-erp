/**
 * User command mappers.
 *
 * Two-step mapping: Input → Command → DTO
 * Following the same pattern as quotation.command-mapper.ts
 */

import type { RoleName } from '../model/role';
import type {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  ChangePasswordRequestDTO,
  AssignCustomersRequestDTO,
} from './user.dto';

// ==================== CREATE USER ====================

/**
 * Input from form (UI-friendly, may have extra whitespace).
 */
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

/**
 * Validated command (normalized, ready for API).
 */
export interface CreateUserCommand {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

// ==================== UPDATE USER ====================

export interface UpdateUserInput {
  fullName: string;
  email: string;
}

export interface UpdateUserCommand {
  fullName: string;
  email: string;
}

// ==================== ASSIGN ROLES ====================

export interface AssignRolesInput {
  roles: RoleName[];
}

export interface AssignRolesCommand {
  roles: RoleName[];
}

// ==================== CHANGE PASSWORD ====================

export interface ChangePasswordInput {
  newPassword: string;
}

export interface ChangePasswordCommand {
  newPassword: string;
}

// ==================== ASSIGN CUSTOMERS ====================

export interface AssignCustomersInput {
  customerIds: number[];
}

export interface AssignCustomersCommand {
  customerIds: number[];
}

/**
 * User command mapper functions.
 */
export const userCommandMapper = {
  // ==================== CREATE ====================

  /**
   * Convert create input to validated command.
   */
  toCreateCommand(input: CreateUserInput): CreateUserCommand {
    return {
      username: input.username.trim().toLowerCase(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName.trim(),
      roles: input.roles,
    };
  },

  /**
   * Convert create command to API DTO.
   */
  toCreateDto(command: CreateUserCommand): CreateUserRequestDTO {
    return {
      username: command.username,
      email: command.email,
      password: command.password,
      fullName: command.fullName,
      roles: command.roles,
    };
  },

  // ==================== UPDATE ====================

  toUpdateCommand(input: UpdateUserInput): UpdateUserCommand {
    return {
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
    };
  },

  toUpdateDto(command: UpdateUserCommand): UpdateUserRequestDTO {
    return {
      fullName: command.fullName,
      email: command.email,
    };
  },

  // ==================== ASSIGN ROLES ====================

  toAssignRolesCommand(input: AssignRolesInput): AssignRolesCommand {
    return {
      roles: input.roles,
    };
  },

  toAssignRolesDto(command: AssignRolesCommand): AssignRolesRequestDTO {
    return {
      roles: command.roles,
    };
  },

  // ==================== CHANGE PASSWORD ====================

  toChangePasswordCommand(input: ChangePasswordInput): ChangePasswordCommand {
    return {
      newPassword: input.newPassword,
    };
  },

  toChangePasswordDto(command: ChangePasswordCommand): ChangePasswordRequestDTO {
    return {
      newPassword: command.newPassword,
    };
  },

  // ==================== ASSIGN CUSTOMERS ====================

  toAssignCustomersCommand(input: AssignCustomersInput): AssignCustomersCommand {
    return {
      customerIds: input.customerIds,
    };
  },

  toAssignCustomersDto(command: AssignCustomersCommand): AssignCustomersRequestDTO {
    return {
      customerIds: command.customerIds,
    };
  },
};
