/**
 * User API - Public API.
 *
 * Exports DTOs, mappers, and API functions.
 */

// DTOs
export type {
  UserDetailsDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  ChangePasswordRequestDTO,
  AssignCustomersRequestDTO,
  UserListParamsDTO,
  UserCommandResultDTO,
} from './user.dto';

// Mappers
export { userMapper } from './user.mapper';

// Command mappers
export { userCommandMapper } from './user.command-mapper';
export type {
  CreateUserInput,
  CreateUserCommand,
  UpdateUserInput,
  UpdateUserCommand,
  AssignRolesInput,
  AssignRolesCommand,
  ChangePasswordInput,
  ChangePasswordCommand,
  AssignCustomersInput,
  AssignCustomersCommand,
} from './user.command-mapper';

// API functions
export { userApi } from './user.api';
