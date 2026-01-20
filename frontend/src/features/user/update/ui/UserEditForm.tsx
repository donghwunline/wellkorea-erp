/**
 * User Edit Form Component.
 *
 * Modal form for editing user details.
 * Uses the useUpdateUser mutation hook for API operations.
 *
 * FSD Layer: features/user/update/ui
 */

import { type FormEvent, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserDetails, UpdateUserInput } from '@/entities/user';
import { Button, ErrorAlert, FormField, Modal } from '@/shared/ui';
import { useUpdateUser } from '../model/use-update-user';

export interface UserEditFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Inner form component that resets when user changes.
 * Using key={user?.id} on the parent forces a remount when user changes.
 */
function UserEditFormInner({
  user,
  onClose,
  onSuccess,
}: Readonly<{
  user: UserDetails;
  onClose: () => void;
  onSuccess?: () => void;
}>) {
  const { t } = useTranslation(['admin', 'common']);
  // Local UI State - form inputs with initial values from user
  const initialData = useMemo<UpdateUserInput>(
    () => ({
      email: user.email,
      fullName: user.fullName,
    }),
    [user.email, user.fullName]
  );

  const [formData, setFormData] = useState<UpdateUserInput>(initialData);
  const [error, setError] = useState<string | null>(null);

  // Use the mutation hook
  const { mutate: updateUser, isPending } = useUpdateUser({
    onSuccess: () => {
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
    updateUser({ id: user.id, data: formData });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <>
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label={t('userForm.username')}
          type="text"
          value={user.username}
          onChange={() => {}}
          disabled
        />

        <FormField
          label={t('userForm.email')}
          type="email"
          value={formData.email}
          onChange={value => setFormData(prev => ({ ...prev, email: value }))}
          required
          disabled={isPending}
        />

        <FormField
          label={t('userForm.fullName')}
          type="text"
          value={formData.fullName}
          onChange={value => setFormData(prev => ({ ...prev, fullName: value }))}
          required
          disabled={isPending}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" isLoading={isPending}>
            {t('userForm.saveChanges')}
          </Button>
        </div>
      </form>
    </>
  );
}

/**
 * Wrapper component that handles null user and renders Modal.
 * Uses key={user?.id} to force remount when user changes.
 */
export function UserEditForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserEditFormProps>) {
  const { t } = useTranslation('admin');
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('userForm.editTitle')}>
      <UserEditFormInner key={user.id} user={user} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}
