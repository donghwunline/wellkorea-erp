/**
 * User pure functions for business rules.
 *
 * All business logic as pure functions that operate on User objects.
 * Following the same pattern as quotationRules and approvalRules.
 */

import type { User, UserDetails } from './user';
import type { RoleName } from './role';
import { ROLE_LABELS } from './role';

/**
 * Pure functions for user business rules.
 */
export const userRules = {
  // ==================== STATUS CHECKS ====================

  /**
   * Check if user account is active.
   */
  isActive(user: UserDetails): boolean {
    return user.isActive;
  },

  /**
   * Check if user account is inactive.
   */
  isInactive(user: UserDetails): boolean {
    return !user.isActive;
  },

  // ==================== PERMISSION CHECKS ====================

  /**
   * Check if user can be edited (deactivated users can't be edited).
   */
  canEdit(user: UserDetails): boolean {
    return user.isActive;
  },

  /**
   * Check if user can be deactivated.
   */
  canDeactivate(user: UserDetails): boolean {
    return user.isActive;
  },

  /**
   * Check if user can be activated.
   */
  canActivate(user: UserDetails): boolean {
    return !user.isActive;
  },

  /**
   * Check if user can have customers assigned (only Sales role).
   */
  canAssignCustomers(user: User | UserDetails): boolean {
    return userRules.hasRole(user, 'ROLE_SALES');
  },

  // ==================== ROLE CHECKS ====================

  /**
   * Check if user has a specific role.
   */
  hasRole(user: User | UserDetails, role: RoleName): boolean {
    return user.roles.includes(role);
  },

  /**
   * Check if user has any of the specified roles.
   */
  hasAnyRole(user: User | UserDetails, roles: RoleName[]): boolean {
    return roles.some(role => user.roles.includes(role));
  },

  /**
   * Check if user is an admin.
   */
  isAdmin(user: User | UserDetails): boolean {
    return userRules.hasRole(user, 'ROLE_ADMIN');
  },

  /**
   * Check if user is a sales user.
   */
  isSales(user: User | UserDetails): boolean {
    return userRules.hasRole(user, 'ROLE_SALES');
  },

  /**
   * Check if user is a finance user.
   */
  isFinance(user: User | UserDetails): boolean {
    return userRules.hasRole(user, 'ROLE_FINANCE');
  },

  /**
   * Check if user is a production user.
   */
  isProduction(user: User | UserDetails): boolean {
    return userRules.hasRole(user, 'ROLE_PRODUCTION');
  },

  // ==================== DISPLAY HELPERS ====================

  /**
   * Get human-readable labels for user's roles.
   */
  getRoleLabels(user: User | UserDetails): string[] {
    return user.roles.map(role => ROLE_LABELS[role]);
  },

  /**
   * Get a display string of all role labels.
   */
  getRolesDisplayText(user: User | UserDetails): string {
    return userRules.getRoleLabels(user).join(', ');
  },

  /**
   * Get user initials for avatar display.
   */
  getInitials(user: User | UserDetails): string {
    const names = user.fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return (names[0]?.substring(0, 2) ?? '').toUpperCase();
  },

  /**
   * Check if user has never logged in.
   */
  hasNeverLoggedIn(user: UserDetails): boolean {
    return user.lastLoginAt === null;
  },
};
