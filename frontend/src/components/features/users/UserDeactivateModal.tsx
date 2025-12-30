/**
 * User Deactivate Modal Component
 *
 * Self-contained confirmation modal that owns its service call.
 * Notifies parent via onSuccess callback after successful deactivation.
 */

import { useState } from 'react';
import { type UserDetails, userService } from '@/services';
import { ConfirmationModal } from '@/shared/ui';

export interface UserDeactivateModalProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserDeactivateModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserDeactivateModalProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await userService.deleteUser(user.id);
      onSuccess();
      onClose();
    } catch {
      // Error is shown via the modal or we could add error state
      // For now, just close and let the table show the unchanged state
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate User"
      message={
        user
          ? `Are you sure you want to deactivate ${user.fullName}? This user will no longer be able to log in.`
          : ''
      }
      confirmLabel={isSubmitting ? 'Deactivating...' : 'Deactivate'}
      variant="danger"
    />
  );
}
