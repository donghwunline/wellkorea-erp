/**
 * User Password Change Form Component.
 *
 * Modal form for changing user passwords.
 * Uses the useChangePassword mutation hook for API operations.
 *
 * FSD Layer: features/user/change-password/ui
 */

import { type FormEvent, useState } from 'react';
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
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">User</p>
          <p className="text-white">{user.fullName}</p>
          <p className="text-sm text-steel-400">{user.email}</p>
        </div>

        <FormField
          label="New Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          disabled={isPending}
          placeholder="Enter new password (min 8 characters)"
        />

        <FormField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          disabled={isPending}
          placeholder="Re-enter new password"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!password || !confirmPassword}>
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
