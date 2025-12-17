/**
 * User Create Form Component
 *
 * Self-contained form modal with local UI state (Tier 1).
 * Receives only data and callbacks from parent.
 */

import { useState, type FormEvent } from 'react';
import { type CreateUserRequest } from '@/services';
import { ALL_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type RoleName } from '@/types/auth';
import { Button, ErrorAlert, FormField, Modal } from '@/components/ui';

export interface UserCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
}

export function UserCreateForm({ isOpen, onClose, onSubmit }: Readonly<UserCreateFormProps>) {
  // Local UI State (Tier 1) - form inputs
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roles: [] as RoleName[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        roles: formData.roles,
      });
      // Reset form on success
      setFormData({ username: '', email: '', password: '', fullName: '', roles: [] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (role: RoleName) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <FormField
          label="Username"
          type="text"
          value={formData.username}
          onChange={value => setFormData(prev => ({ ...prev, username: value }))}
          required
          disabled={isSubmitting}
          placeholder="Enter username"
        />

        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={value => setFormData(prev => ({ ...prev, email: value }))}
          required
          disabled={isSubmitting}
          placeholder="user@example.com"
        />

        <FormField
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={value => setFormData(prev => ({ ...prev, fullName: value }))}
          required
          disabled={isSubmitting}
          placeholder="Enter full name"
        />

        <FormField
          label="Password"
          type="password"
          value={formData.password}
          onChange={value => setFormData(prev => ({ ...prev, password: value }))}
          required
          disabled={isSubmitting}
          placeholder="Enter password"
        />

        {/* Role Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-steel-300">
            Roles <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={isSubmitting}
                className={`rounded-lg border p-3 text-left transition-all ${
                  formData.roles.includes(role)
                    ? 'border-copper-500 bg-copper-500/10'
                    : 'border-steel-700/50 bg-steel-900/60 hover:border-steel-600'
                } disabled:opacity-50`}
              >
                <div className="mb-1 font-medium text-white">{ROLE_LABELS[role]}</div>
                <div className="text-xs text-steel-400">{ROLE_DESCRIPTIONS[role]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={
              !formData.username ||
              !formData.email ||
              !formData.password ||
              !formData.fullName ||
              formData.roles.length === 0
            }
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}
