/**
 * User Deactivate Modal Component.
 *
 * Confirmation modal for deactivating users.
 * Uses the useDeactivateUser mutation hook for API operations.
 *
 * FSD Layer: features/user/deactivate/ui
 */

import type { UserDetails } from '@/entities/user';
import { ConfirmationModal } from '@/shared/ui';
import { useDeactivateUser } from '../model/use-deactivate-user';

export interface UserDeactivateModalProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserDeactivateModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserDeactivateModalProps>) {
  const { mutate: deactivateUser, isPending } = useDeactivateUser({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: () => {
      // Error handling - just close modal for now
      onClose();
    },
  });

  const handleConfirm = () => {
    if (user) {
      deactivateUser(user.id);
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
      confirmLabel={isPending ? 'Deactivating...' : 'Deactivate'}
      variant="danger"
    />
  );
}
