/**
 * User Deactivate Modal Component.
 *
 * Confirmation modal for deactivating users.
 * Uses the useDeactivateUser mutation hook for API operations.
 *
 * FSD Layer: features/user/deactivate/ui
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['admin', 'common']);
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
      title={t('admin:userDeactivate.title')}
      message={
        user
          ? t('admin:userDeactivate.message', { username: user.fullName })
          : ''
      }
      confirmLabel={isPending ? t('common:status.processing') : t('admin:userDeactivate.confirm')}
      variant="danger"
    />
  );
}
