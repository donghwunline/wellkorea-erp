/**
 * User Customer Assignment Form Component.
 *
 * Modal form for assigning customers to sales users.
 * Uses the useAssignCustomers mutation hook for API operations.
 *
 * FSD Layer: features/user/assign-customers/ui
 */

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UserDetails } from '@/entities/user';
import { userApi } from '@/entities/user';
import { companyQueries } from '@/entities/company';
import { Button, ErrorAlert, LoadingState, Modal } from '@/shared/ui';
import { useAssignCustomers } from '../model/use-assign-customers';

export interface UserCustomersFormProps {
  isOpen: boolean;
  user: UserDetails | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserCustomersForm({
  isOpen,
  user,
  onClose,
  onSuccess,
}: Readonly<UserCustomersFormProps>) {
  // Local UI State
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Fetch available customers using Query Factory
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    ...companyQueries.list({
      page: 0,
      size: 100,
      search: '',
      roleType: 'CUSTOMER',
    }),
    enabled: isOpen && !!user,
  });

  const availableCustomers = customersData?.data ?? [];

  // Load user's current customer assignments
  const loadAssignments = useCallback(async () => {
    if (!user) return;

    setIsLoadingAssignments(true);
    try {
      const customerIds = await userApi.getCustomers(user.id);
      setSelectedCustomers(customerIds);
    } catch {
      setError('Failed to load customer assignments');
      setSelectedCustomers([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadAssignments();
    }
  }, [isOpen, user, loadAssignments]);

  // Use the mutation hook
  const { mutate: assignCustomers, isPending } = useAssignCustomers({
    onSuccess: () => {
      setError(null);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    assignCustomers({ id: user.id, data: { customerIds: selectedCustomers } });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!user) return null;

  const isLoading = isLoadingCustomers || isLoadingAssignments;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Customers">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        <div>
          <p className="mb-1 text-sm font-medium text-steel-300">User</p>
          <p className="text-white">{user.fullName}</p>
          <p className="text-sm text-steel-400">{user.email}</p>
        </div>

        {isLoading ? (
          <LoadingState message="Loading customers..." />
        ) : availableCustomers.length === 0 ? (
          <div className="rounded-lg bg-steel-800/50 p-4 text-center text-steel-400">
            No customers available. Add companies with the Customer role first.
          </div>
        ) : (
          <div>
            <span className="mb-3 block text-sm font-medium text-steel-300">
              Select Customers
            </span>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableCustomers.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => toggleCustomer(customer.id)}
                  disabled={isPending}
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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Save Assignments
          </Button>
        </div>
      </form>
    </Modal>
  );
}
