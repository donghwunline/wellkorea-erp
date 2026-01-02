/**
 * User DTO ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 * Following the same pattern as quotation.mapper.ts
 */

import type { UserDetails, UserListItem } from '../model/user';
import type { UserDetailsDTO } from './user.dto';

/**
 * User mapper functions.
 */
export const userMapper = {
  /**
   * Map UserDetailsDTO to UserDetails domain model.
   *
   * Normalizes data (lowercase email, trim strings).
   */
  toDomain(dto: UserDetailsDTO): UserDetails {
    return {
      id: dto.id,
      username: dto.username.trim(),
      email: dto.email.toLowerCase().trim(),
      fullName: dto.fullName.trim(),
      isActive: dto.isActive,
      roles: dto.roles,
      createdAt: dto.createdAt,
      lastLoginAt: dto.lastLoginAt,
    };
  },

  /**
   * Map UserDetails to UserListItem (for list views).
   */
  toListItem(user: UserDetails): UserListItem {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      roles: user.roles,
      lastLoginAt: user.lastLoginAt,
    };
  },

  /**
   * Map DTO directly to list item (optimization for lists).
   */
  dtoToListItem(dto: UserDetailsDTO): UserListItem {
    return {
      id: dto.id,
      username: dto.username.trim(),
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      isActive: dto.isActive,
      roles: dto.roles,
      lastLoginAt: dto.lastLoginAt,
    };
  },
};
