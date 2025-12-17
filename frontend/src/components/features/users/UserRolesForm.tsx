/**
 * User Roles Assignment Form Component
 *
 * Self-contained form modal that owns its service call.
 * Notifies parent via onSuccess callback after successful role assignment.
 */

import { useState, type FormEvent } from 'react';
import { userService, type UserDetails } from '@/services';
import { ALL_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type RoleName } from '@/shared/types/auth';
import { Badge, Button, ErrorAlert, Modal } from '@/components/ui';

export interface UserRolesFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserRolesForm({ isOpen, user, onClose, onSuccess }: Readonly<UserRolesFormProps>) {
  // Local UI State (Tier 1)
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(user?.roles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update selected roles when user changes
  useState(() => {
    if (user) {
      setSelectedRoles([...user.roles]);
    }
  });

  const toggleRole = (role: RoleName) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await userService.assignRoles(user.id, { roles: selectedRoles });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign roles');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Roles">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

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
          <label className="mb-3 block text-sm font-medium text-steel-300">Select Roles</label>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={isSubmitting}
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={selectedRoles.length === 0}>
            Save Roles
          </Button>
        </div>
      </form>
    </Modal>
  );
}
