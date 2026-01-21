/**
 * User Create Form Component.
 *
 * Modal form for creating new users.
 * Uses the useCreateUser mutation hook for API operations.
 *
 * FSD Layer: features/user/create/ui
 */

import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ALL_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type RoleName,
  type CreateUserInput,
} from '@/entities/user';
import { Button, ErrorAlert, FormField, Modal } from '@/shared/ui';
import { useCreateUser } from '../model/use-create-user';

export interface UserCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserCreateForm({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<UserCreateFormProps>) {
  const { t } = useTranslation(['admin', 'common']);
  // Local UI State - form inputs
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    roles: [],
  });

  const [error, setError] = useState<string | null>(null);

  // Use the mutation hook
  const { mutate: createUser, isPending } = useCreateUser({
    onSuccess: () => {
      // Reset form on success
      setFormData({ username: '', email: '', password: '', fullName: '', roles: [] });
      setError(null);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    createUser(formData);
  };

  const toggleRole = (role: RoleName) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('userForm.createTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <FormField
          label={t('userForm.username')}
          type="text"
          value={formData.username}
          onChange={value => setFormData(prev => ({ ...prev, username: value }))}
          required
          disabled={isPending}
          placeholder={t('userForm.placeholders.username')}
        />

        <FormField
          label={t('userForm.email')}
          type="email"
          value={formData.email}
          onChange={value => setFormData(prev => ({ ...prev, email: value }))}
          required
          disabled={isPending}
          placeholder={t('userForm.placeholders.email')}
        />

        <FormField
          label={t('userForm.fullName')}
          type="text"
          value={formData.fullName}
          onChange={value => setFormData(prev => ({ ...prev, fullName: value }))}
          required
          disabled={isPending}
          placeholder={t('userForm.placeholders.fullName')}
        />

        <FormField
          label={t('userForm.password')}
          type="password"
          value={formData.password}
          onChange={value => setFormData(prev => ({ ...prev, password: value }))}
          required
          disabled={isPending}
          placeholder={t('userForm.placeholders.password')}
        />

        {/* Role Selection */}
        <div>
          <span className="mb-3 block text-sm font-medium text-steel-300">
            {t('userForm.roles')} <span className="text-red-400">*</span>
          </span>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={isPending}
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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            {t('common:buttons.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={
              !formData.username ||
              !formData.email ||
              !formData.password ||
              !formData.fullName ||
              formData.roles.length === 0
            }
          >
            {t('userForm.createUser')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
