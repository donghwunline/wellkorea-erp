/**
 * EmailTagInput component for entering multiple email addresses as tags.
 *
 * Features:
 * - Tag-based UI with removable email tags
 * - Inline validation for each email
 * - Add email on Enter or blur
 * - Prevents duplicate emails
 *
 * Usage:
 * ```tsx
 * <EmailTagInput
 *   label="CC Recipients"
 *   emails={ccEmails}
 *   onChange={setCcEmails}
 *   placeholder="Enter email and press Enter"
 * />
 * ```
 */

import { useState, useCallback, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '../primitives/Icon';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailTagInputProps {
  /** Label for the input field */
  label?: string;
  /** Current list of email addresses */
  emails: string[];
  /** Callback when emails list changes */
  onChange: (emails: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Overall error message (e.g., from backend validation) */
  error?: string;
  /** Additional class names */
  className?: string;
}

interface EmailTag {
  email: string;
  isValid: boolean;
}

/**
 * Validates an email address format.
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Tag-based email input component with inline validation.
 */
export function EmailTagInput({
  label,
  emails,
  onChange,
  placeholder = 'Enter email and press Enter',
  disabled = false,
  error,
  className,
}: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Convert emails to tags with validation status
  const tags: EmailTag[] = emails.map(email => ({
    email,
    isValid: isValidEmail(email),
  }));

  // Check if all emails are valid
  const hasInvalidEmails = tags.some(tag => !tag.isValid);

  /**
   * Add email to the list if valid and not duplicate.
   */
  const addEmail = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) {
        setInputError(null);
        return;
      }

      // Check for duplicate
      if (emails.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
        setInputError('Email already added');
        return;
      }

      // Validate format
      if (!isValidEmail(trimmed)) {
        setInputError('Invalid email format');
        return;
      }

      // Add to list
      onChange([...emails, trimmed]);
      setInputValue('');
      setInputError(null);
    },
    [emails, onChange]
  );

  /**
   * Remove email from the list.
   */
  const removeEmail = useCallback(
    (emailToRemove: string) => {
      onChange(emails.filter(e => e !== emailToRemove));
    },
    [emails, onChange]
  );

  /**
   * Handle keyboard events (Enter to add).
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addEmail(inputValue);
      } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
        // Remove last tag on backspace when input is empty
        removeEmail(emails[emails.length - 1]);
      }
    },
    [inputValue, addEmail, emails, removeEmail]
  );

  /**
   * Handle blur event (add email on blur if valid).
   */
  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  }, [inputValue, addEmail]);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-steel-300">{label}</label>}

      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2',
          'bg-steel-900/60 transition-colors',
          'focus-within:border-copper-500/50 focus-within:ring-2 focus-within:ring-copper-500/20',
          disabled && 'cursor-not-allowed opacity-50',
          error || hasInvalidEmails
            ? 'border-red-500/50 focus-within:border-red-500/50 focus-within:ring-red-500/20'
            : 'border-steel-700/50'
        )}
      >
        {/* Email Tags */}
        {tags.map(({ email, isValid }) => (
          <span
            key={email}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm',
              isValid
                ? 'bg-steel-700/50 text-steel-200'
                : 'bg-red-900/30 text-red-300 ring-1 ring-red-500/50'
            )}
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-0.5 rounded-sm hover:bg-steel-600/50 focus:outline-none"
                aria-label={`Remove ${email}`}
              >
                <Icon name="x-mark" className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        ))}

        {/* Input Field */}
        <input
          type="email"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setInputError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={emails.length === 0 ? placeholder : ''}
          className={cn(
            'flex-1 bg-transparent text-sm text-white placeholder-steel-500',
            'min-w-[120px] focus:outline-none',
            'disabled:cursor-not-allowed'
          )}
        />
      </div>

      {/* Error Messages */}
      {inputError && <span className="text-xs text-red-400">{inputError}</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
      {hasInvalidEmails && !inputError && !error && (
        <span className="text-xs text-red-400">Some email addresses are invalid</span>
      )}
    </div>
  );
}

export default EmailTagInput;
