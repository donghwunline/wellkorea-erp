/**
 * User Management Page - Admin Only
 *
 * Features:
 * - Paginated user list with search
 * - Create, update, and deactivate users
 * - Role assignment
 * - Password reset
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { userApi } from '@/services';
import type { PaginationMetadata } from '@/types/api';
import type {
  UserDetails,
  RoleName,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types/auth';

const ALL_ROLES: RoleName[] = ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_PRODUCTION', 'ROLE_SALES'];

const ROLE_LABEL_MAP: Record<RoleName, string> = {
  ROLE_ADMIN: 'Administrator',
  ROLE_FINANCE: 'Finance',
  ROLE_PRODUCTION: 'Production',
  ROLE_SALES: 'Sales',
};

const ROLE_DESCRIPTION_MAP: Record<RoleName, string> = {
  ROLE_ADMIN: 'Full system access',
  ROLE_FINANCE: 'Quotations, invoices, AR/AP',
  ROLE_PRODUCTION: 'Work progress tracking',
  ROLE_SALES: 'Assigned customer quotations',
};

type ModalType = 'create' | 'edit' | 'roles' | 'password' | 'delete' | null;

export function UserManagementPage() {
  // List state
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roles: [] as RoleName[],
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.getUsers({
        page,
        size: 10,
        search: search || undefined,
      });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search handler
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  // Open modals
  const openCreateModal = () => {
    setFormData({ username: '', email: '', password: '', fullName: '', roles: [] });
    setModalError(null);
    setModalType('create');
  };

  const openEditModal = (user: UserDetails) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      roles: user.roles,
    });
    setModalError(null);
    setModalType('edit');
  };

  const openRolesModal = (user: UserDetails) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, roles: [...user.roles] }));
    setModalError(null);
    setModalType('roles');
  };

  const openPasswordModal = (user: UserDetails) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, password: '' }));
    setModalError(null);
    setModalType('password');
  };

  const openDeleteModal = (user: UserDetails) => {
    setSelectedUser(user);
    setModalError(null);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setModalError(null);
  };

  // Toggle role selection
  const toggleRole = (role: RoleName) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  // Create user
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const request: CreateUserRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        roles: formData.roles,
      };
      await userApi.createUser(request);
      closeModal();
      fetchUsers();
    } catch {
      setModalError('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const request: UpdateUserRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };
      await userApi.updateUser(selectedUser.id, request);
      closeModal();
      fetchUsers();
    } catch {
      setModalError('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign roles
  const handleAssignRoles = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await userApi.assignRoles(selectedUser.id, {roles: formData.roles});
      closeModal();
      fetchUsers();
    } catch {
      setModalError('Failed to assign roles');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await userApi.changePassword(selectedUser.id, {newPassword: formData.password});
      closeModal();
    } catch {
      setModalError('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate user
  const handleDeactivate = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await userApi.deleteUser(selectedUser.id);
      closeModal();
      fetchUsers();
    } catch {
      setModalError('Failed to deactivate user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activate user
  const handleActivate = async (user: UserDetails) => {
    try {
      await userApi.activateUser(user.id);
      fetchUsers();
    } catch {
      setError('Failed to activate user');
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Common input classes
  const inputClasses =
    'block w-full rounded-lg border border-steel-700/50 bg-steel-800/50 px-4 py-2.5 text-sm text-white placeholder-steel-500 transition-all duration-200 focus:border-copper-500/50 focus:bg-steel-800 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-steel-400">Manage system users and their roles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-copper-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-steel-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-steel-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-steel-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-lg border border-steel-700/50 px-4 py-2.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-steel-800/50 bg-steel-900/60 backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-steel-800/50 bg-steel-900/80">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Roles
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Last Login
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-steel-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800/30">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <svg
                    className="mx-auto h-8 w-8 animate-spin text-copper-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-steel-400">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-steel-400">
                  {search ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="transition-colors hover:bg-steel-800/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{user.fullName}</div>
                      <div className="text-sm text-steel-400">{user.username}</div>
                      <div className="text-xs text-steel-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <span
                          key={role}
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            role === 'ROLE_ADMIN'
                              ? 'bg-copper-500/20 text-copper-400'
                              : role === 'ROLE_FINANCE'
                                ? 'bg-green-500/20 text-green-400'
                                : role === 'ROLE_PRODUCTION'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {ROLE_LABEL_MAP[role]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-steel-400">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                        title="Edit user"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openRolesModal(user)}
                        className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                        title="Manage roles"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                        title="Change password"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="rounded-lg p-2 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Deactivate user"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          className="rounded-lg p-2 text-green-400/70 transition-colors hover:bg-green-500/10 hover:text-green-400"
                          title="Activate user"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-steel-800/50 bg-steel-900/80 px-6 py-3">
            <div className="text-sm text-steel-400">
              Showing {page * pagination.size + 1} -{' '}
              {Math.min((page + 1) * pagination.size, pagination.totalElements)} of{' '}
              {pagination.totalElements} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={pagination.first}
                className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.last}
                className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Backdrop */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-steel-800/50 bg-steel-900 p-6 shadow-elevated">
            {/* Create User Modal */}
            {modalType === 'create' && (
              <form onSubmit={handleCreate}>
                <h2 className="mb-6 text-xl font-semibold text-white">Create User</h2>

                {modalError && (
                  <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className={inputClasses}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={inputClasses}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={inputClasses}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={inputClasses}
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-steel-300">Roles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_ROLES.map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                            formData.roles.includes(role)
                              ? 'border-copper-500/50 bg-copper-500/10'
                              : 'border-steel-700/50 bg-steel-800/30 hover:border-steel-600'
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${formData.roles.includes(role) ? 'text-copper-400' : 'text-white'}`}
                          >
                            {ROLE_LABEL_MAP[role]}
                          </span>
                          <span className="text-xs text-steel-500">{ROLE_DESCRIPTION_MAP[role]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Create User
                  </button>
                </div>
              </form>
            )}

            {/* Edit User Modal */}
            {modalType === 'edit' && selectedUser && (
              <form onSubmit={handleUpdate}>
                <h2 className="mb-6 text-xl font-semibold text-white">Edit User</h2>

                {modalError && (
                  <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      disabled
                      className={`${inputClasses} cursor-not-allowed opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-steel-300">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Roles Modal */}
            {modalType === 'roles' && selectedUser && (
              <form onSubmit={handleAssignRoles}>
                <h2 className="mb-2 text-xl font-semibold text-white">Manage Roles</h2>
                <p className="mb-6 text-sm text-steel-400">
                  Assign roles for <span className="text-white">{selectedUser.fullName}</span>
                </p>

                {modalError && (
                  <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                        formData.roles.includes(role)
                          ? 'border-copper-500/50 bg-copper-500/10'
                          : 'border-steel-700/50 bg-steel-800/30 hover:border-steel-600'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${formData.roles.includes(role) ? 'text-copper-400' : 'text-white'}`}
                      >
                        {ROLE_LABEL_MAP[role]}
                      </span>
                      <span className="text-xs text-steel-500">{ROLE_DESCRIPTION_MAP[role]}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Update Roles
                  </button>
                </div>
              </form>
            )}

            {/* Password Modal */}
            {modalType === 'password' && selectedUser && (
              <form onSubmit={handleChangePassword}>
                <h2 className="mb-2 text-xl font-semibold text-white">Change Password</h2>
                <p className="mb-6 text-sm text-steel-400">
                  Set a new password for <span className="text-white">{selectedUser.fullName}</span>
                </p>

                {modalError && (
                  <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-steel-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={inputClasses}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Change Password
                  </button>
                </div>
              </form>
            )}

            {/* Delete Confirmation Modal */}
            {modalType === 'delete' && selectedUser && (
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-white">Deactivate User</h2>
                <p className="mb-6 text-sm text-steel-400">
                  Are you sure you want to deactivate{' '}
                  <span className="text-white">{selectedUser.fullName}</span>? This user will no
                  longer be able to log in.
                </p>

                {modalError && (
                  <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {modalError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Deactivate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
