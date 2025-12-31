/**
 * Auth DTO ↔ Domain mappers.
 */

import type { User } from '@/entities/user';
import type { LoginResponseDTO, LoginUserDTO } from './auth.dto';

/**
 * Result of successful login.
 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string | null;
  user: User;
}

/**
 * Auth mapper functions.
 */
export const authMapper = {
  /**
   * Map login user DTO to User domain model.
   */
  userToDomain(dto: LoginUserDTO): User {
    return {
      id: dto.id,
      username: dto.username.trim(),
      email: dto.email.toLowerCase().trim(),
      fullName: dto.fullName.trim(),
      roles: dto.roles,
    };
  },

  /**
   * Map login response DTO to LoginResult.
   */
  toLoginResult(dto: LoginResponseDTO): LoginResult {
    return {
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken ?? null,
      user: authMapper.userToDomain(dto.user),
    };
  },
};
