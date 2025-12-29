/**
 * UserCombobox - Reusable User Selector Component
 *
 * A specialized Combobox for selecting users.
 * Encapsulates userService calls and provides consistent user selection UI.
 *
 * Usage:
 * ```tsx
 * <UserCombobox
 *   value={selectedUserId}
 *   onChange={setSelectedUserId}
 *   label="Approver"
 *   placeholder="Select an approver..."
 * />
 * ```
 */

import { useCallback } from 'react';
import { userService } from '@/services';
import { Combobox, type ComboboxOption } from '@/components/ui';

export interface UserComboboxProps {
  /** Currently selected user ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (userId: number | null) => void;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Additional class name */
  className?: string;
  /** Initial label for pre-selected value (used in edit mode before options load) */
  initialLabel?: string | null;
}

/**
 * User selector component that wraps Combobox with userService.
 */
export function UserCombobox({
  value,
  onChange,
  label,
  placeholder = 'Search for a user...',
  required,
  disabled,
  error,
  helpText,
  className,
  initialLabel,
}: Readonly<UserComboboxProps>) {
  /**
   * Load users from API based on search query.
   * Transforms UserDetails to ComboboxOption format.
   */
  const loadUsers = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await userService.getUsers({
      search: query,
      page: 0,
      size: 20,
    });

    return result.data.map(user => ({
      id: user.id,
      label: user.fullName || user.username,
      description: user.email,
    }));
  }, []);

  /**
   * Handle selection change.
   * Converts ComboboxOption to user ID.
   */
  const handleChange = useCallback(
    (id: string | number | null) => {
      onChange(id === null ? null : Number(id));
    },
    [onChange]
  );

  return (
    <Combobox
      value={value}
      onChange={handleChange}
      loadOptions={loadUsers}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
      initialLabel={initialLabel}
    />
  );
}
