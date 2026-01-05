/**
 * User Roles Assignment Form Component.
 *
 * Modal form for assigning roles to users.
 * Uses the useAssignRoles mutation hook for API operations.
 *
 * FSD Layer: features/user/assign-roles/ui
 */

import { type FormEvent, useState, useMemo } from 'react';
import {
  ALL_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type RoleName,
  type UserDetails,
} from '@/entities/user';
import { Badge, Button, ErrorAlert, Modal } from '@/shared/ui';
import { useAssignRoles } from '../model/use-assign-roles';

export interface UserRolesFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Inner form component that resets when user changes.
 */
function UserRolesFormInner({
  user,
  onClose,
  onSuccess,
}: Readonly<{
  user: UserDetails;
  onClose: () => void;
  onSuccess?: () => void;
}>) {
  // Initial roles from user
  const initialRoles = useMemo(() => [...user.roles], [user.roles]);

  // Local UI State
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(initialRoles);
  const [error, setError] = useState<string | null>(null);

  // Use the mutation hook
  const { mutate: assignRoles, isPending } = useAssignRoles({
    onSuccess: () => {
      setError(null);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const toggleRole = (role: RoleName) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    assignRoles({ id: user.id, data: { roles: selectedRoles } });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <>
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">User</p>
          <p className="text-white">{user.fullName}</p>
          <p className="text-sm text-steel-400">{user.email}</p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">Current Roles</p>
          <div className="flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map(role => <Badge key={role}>{ROLE_LABELS[role]}</Badge>)
            ) : (
              <span className="text-sm text-steel-500">No roles assigned</span>
            )}
          </div>
        </div>

        <div>
          <span className="mb-3 block text-sm font-medium text-steel-300">Select Roles</span>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={isPending}
                className={`rounded-lg border p-3 text-left transition-all ${
                  selectedRoles.includes(role)
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending} disabled={selectedRoles.length === 0}>
            Save Roles
          </Button>
        </div>
      </form>
    </>
  );
}

/**
 * Wrapper component that handles null user and renders Modal.
 */
export function UserRolesForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserRolesFormProps>) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Roles">
      <UserRolesFormInner key={user.id} user={user} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}
