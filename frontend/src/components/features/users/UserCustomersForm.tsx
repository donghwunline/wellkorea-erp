/**
 * User Customer Assignment Form Component
 *
 * Self-contained form modal that owns its service call.
 * Notifies parent via onSuccess callback after successful customer assignment.
 */

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { companyService, type CompanySummary, type UserDetails, userService } from '@/services';
import { Button, ErrorAlert, LoadingState, Modal } from '@/components/ui';

export interface UserCustomersFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserCustomersForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserCustomersFormProps>) {
  // Local UI State
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<CompanySummary[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available customers and user's current assignments when modal opens
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoadingCustomers(true);
    setError(null);
    try {
      // Load all customers from companyService
      const customersResult = await companyService.getCompanies({
        roleType: 'CUSTOMER',
        page: 0,
        size: 100, // Load all customers for selection
      });
      setAvailableCustomers(customersResult.data);

      // Load user's current customer assignments
      const customerIds = await userService.getUserCustomers(user.id);
      setSelectedCustomers(customerIds);
    } catch {
      setError('Failed to load customer data');
      setAvailableCustomers([]);
      setSelectedCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user, loadData]);

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await userService.assignCustomers(user.id, selectedCustomers);
      onSuccess();
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
          <LoadingState message="Loading customers..." />
        ) : availableCustomers.length === 0 ? (
          <div className="rounded-lg bg-steel-800/50 p-4 text-center text-steel-400">
            No customers available. Add companies with the Customer role first.
          </div>
        ) : (
          <div>
            <label className="mb-3 block text-sm font-medium text-steel-300">
              Select Customers
            </label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableCustomers.map(customer => (
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
                    {customer.email && (
                      <div className="text-xs text-steel-400">{customer.email}</div>
                    )}
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
