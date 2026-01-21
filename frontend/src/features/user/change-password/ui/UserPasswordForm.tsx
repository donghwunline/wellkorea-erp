/**
 * User Password Change Form Component.
 *
 * Modal form for changing user passwords.
 * Uses the useChangePassword mutation hook for API operations.
 *
 * FSD Layer: features/user/change-password/ui
 */

import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserDetails } from '@/entities/user';
import { Button, ErrorAlert, FormField, Modal } from '@/shared/ui';
import { useChangePassword } from '../model/use-change-password';

export interface UserPasswordFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserPasswordForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserPasswordFormProps>) {
  const { t } = useTranslation(['admin', 'common']);
  // Local UI State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use the mutation hook
  const { mutate: changePassword, isPending } = useChangePassword({
    onSuccess: () => {
      setPassword('');
      setConfirmPassword('');
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
    if (!user) return;

    if (password !== confirmPassword) {
      setError(t('passwordForm.validation.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordForm.validation.passwordMinLength'));
      return;
    }

    setError(null);
    changePassword({ id: user.id, data: { newPassword: password } });
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('passwordForm.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">{t('passwordForm.user')}</p>
          <p className="text-white">{user.fullName}</p>
          <p className="text-sm text-steel-400">{user.email}</p>
        </div>

        <FormField
          label={t('passwordForm.newPassword')}
          type="password"
          value={password}
          onChange={setPassword}
          required
          disabled={isPending}
          placeholder={t('passwordForm.placeholders.newPassword')}
        />

        <FormField
          label={t('passwordForm.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          disabled={isPending}
          placeholder={t('passwordForm.placeholders.confirmPassword')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!password || !confirmPassword}>
            {t('passwordForm.changePassword')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
