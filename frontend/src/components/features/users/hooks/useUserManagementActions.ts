/**
 * User management CRUD actions hook
 *
 * Encapsulates all service calls for user management.
 * Pages use this hook instead of calling userService directly.
 *
 * Pattern: Feature hook returns actions + refresh trigger
 *
 * @example
 * ```typescript
 * const { createUser, updateUser, deleteUser, refreshTrigger } = useUserManagementActions();
 *
 * // In table component
 * useEffect(() => { fetchUsers(); }, [refreshTrigger]);
 *
 * // In form submission
 * await createUser(formData);
 * ```
 */

import { useCallback, useReducer } from 'react';
import { userService } from '@/services';
import type { CreateUserRequest, UpdateUserRequest, RoleName } from '@/shared/types';

export interface UseUserManagementActionsReturn {
  // CRUD actions
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: number, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  activateUser: (id: number) => Promise<void>;
  assignRoles: (id: number, roles: RoleName[]) => Promise<void>;
  changePassword: (id: number, password: string) => Promise<void>;
  assignCustomers: (id: number, customerIds: number[]) => Promise<void>;

  // Refresh trigger (increment to trigger table reload)
  refreshTrigger: number;
}

/**
 * Hook providing user management CRUD actions.
 *
 * Actions call userService internally and increment refreshTrigger on success.
 * Components can watch refreshTrigger to know when to refetch data.
 */
export function useUserManagementActions(): UseUserManagementActionsReturn {
  // Refresh trigger: increment to signal components to refetch
  const [refreshTrigger, triggerRefresh] = useReducer((x: number) => x + 1, 0);

  const createUser = useCallback(async (data: CreateUserRequest) => {
    await userService.createUser(data);
    triggerRefresh();
  }, []);

  const updateUser = useCallback(async (id: number, data: UpdateUserRequest) => {
    await userService.updateUser(id, data);
    triggerRefresh();
  }, []);

  const deleteUser = useCallback(async (id: number) => {
    await userService.deleteUser(id);
    triggerRefresh();
  }, []);

  const activateUser = useCallback(async (id: number) => {
    await userService.activateUser(id);
    triggerRefresh();
  }, []);

  const assignRoles = useCallback(async (id: number, roles: RoleName[]) => {
    await userService.assignRoles(id, { roles });
    triggerRefresh();
  }, []);

  const changePassword = useCallback(async (id: number, password: string) => {
    await userService.changePassword(id, { newPassword: password });
    // Note: Password change doesn't affect table display, but refresh anyway for consistency
  }, []);

  const assignCustomers = useCallback(async (id: number, customerIds: number[]) => {
    await userService.assignCustomers(id, customerIds);
    // Note: Customer assignment doesn't affect table display
  }, []);

  return {
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    assignRoles,
    changePassword,
    assignCustomers,
    refreshTrigger,
  };
}
