/**
 * User Customer Assignment Form Component
 *
 * Self-contained form modal for assigning customers to a user.
 * Local UI state (Tier 1) for customer selection.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { type UserDetails, userService } from '@/services';
import { Button, ErrorAlert, LoadingState, Modal } from '@/components/ui';

export interface UserCustomersFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSubmit: (id: number, customerIds: number[]) => Promise<void>;
}

// Mock customer data (TODO: Replace with real customer service when implemented)
const MOCK_CUSTOMERS = [
  { id: 1, name: 'Samsung Electronics', code: 'SAMSUNG' },
  { id: 2, name: 'LG Display', code: 'LG' },
  { id: 3, name: 'Hyundai Motor', code: 'HYUNDAI' },
  { id: 4, name: 'SK Hynix', code: 'SKHYNIX' },
  { id: 5, name: 'POSCO', code: 'POSCO' },
];

export function UserCustomersForm({
  isOpen,
  user,
  onClose,
  onSubmit,
}: Readonly<UserCustomersFormProps>) {
  // Local UI State (Tier 1)
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's current customers when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        setError(null);
        try {
          const customerIds = await userService.getUserCustomers(user.id);
          setSelectedCustomers(customerIds);
        } catch {
          setError('Failed to load customer assignments');
          setSelectedCustomers([]);
        } finally {
          setIsLoadingCustomers(false);
        }
      };
      loadCustomers();
    }
  }, [isOpen, user]);

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(user.id, selectedCustomers);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign customers');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Customers">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">User</p>
          <p className="text-white">{user.fullName}</p>
          <p className="text-sm text-steel-400">{user.email}</p>
        </div>

        {isLoadingCustomers ? (
          <LoadingState message="Loading customer assignments..." />
        ) : (
          <div>
            <label className="mb-3 block text-sm font-medium text-steel-300">
              Select Customers
            </label>
            <div className="space-y-2">
              {MOCK_CUSTOMERS.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => toggleCustomer(customer.id)}
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                    selectedCustomers.includes(customer.id)
                      ? 'border-copper-500 bg-copper-500/10'
                      : 'border-steel-700/50 bg-steel-900/60 hover:border-steel-600'
                  } disabled:opacity-50`}
                >
                  <div>
                    <div className="font-medium text-white">{customer.name}</div>
                    <div className="text-xs text-steel-400">{customer.code}</div>
                  </div>
                  {selectedCustomers.includes(customer.id) && (
                    <svg
                      className="h-5 w-5 text-copper-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Assignments
          </Button>
        </div>
      </form>
    </Modal>
  );
}
