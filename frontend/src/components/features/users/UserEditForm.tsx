/**
 * User Edit Form Component
 *
 * Self-contained form modal that owns its service call.
 * Notifies parent via onSuccess callback after successful update.
 */

import { useState, type FormEvent } from 'react';
import { userService, type UserDetails } from '@/services';
import { Button, ErrorAlert, FormField, Modal } from '@/components/ui';

export interface UserEditFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserEditForm({ isOpen, user, onClose, onSuccess }: Readonly<UserEditFormProps>) {
  // Local UI State (Tier 1)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when user prop changes
  useState(() => {
    if (user) {
      setFormData({
        email: user.email,
        fullName: user.fullName,
      });
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await userService.updateUser(user.id, {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <FormField
          label="Username"
          type="text"
          value={user.username}
          onChange={() => {}}
          disabled
        />

        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={value => setFormData(prev => ({ ...prev, email: value }))}
          required
          disabled={isSubmitting}
        />

        <FormField
          label="Full Name"
          type="text"
          value={formData.fullName}
          onChange={value => setFormData(prev => ({ ...prev, fullName: value }))}
          required
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
