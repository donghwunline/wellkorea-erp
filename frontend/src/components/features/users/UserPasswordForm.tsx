/**
 * User Password Change Form Component
 *
 * Self-contained form modal that owns its service call.
 * Notifies parent via onSuccess callback after successful password change.
 */

import { type FormEvent, useState } from 'react';
import { type UserDetails, userService } from '@/services';
import { Button, ErrorAlert, FormField, Modal } from '@/shared/ui';

export interface UserPasswordFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserPasswordForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserPasswordFormProps>) {
  // Local UI State (Tier 1)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
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

    setIsSubmitting(true);
    setError(null);

    try {
      await userService.changePassword(user.id, { newPassword: password });
      setPassword('');
      setConfirmPassword('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
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
          disabled={isSubmitting}
          placeholder="Enter new password (min 8 characters)"
        />

        <FormField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          disabled={isSubmitting}
          placeholder="Re-enter new password"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!password || !confirmPassword}>
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
