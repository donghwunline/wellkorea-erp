/**
 * Login mutation hook.
 *
 * Wraps auth store login for consistent mutation interface.
 * UX side-effects (navigation, toast) belong in this feature layer.
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth, type LoginCredentials } from '@/entities/auth';

/**
 * Options for useLogin hook.
 */
export interface UseLoginOptions {
  /**
   * Callback on successful login.
   */
  onSuccess?: () => void;

  /**
   * Callback on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for user login.
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const navigate = useNavigate();
 *   const { mutate: login, isPending, error } = useLogin({
 *     onSuccess: () => {
 *       toast.success('Login successful');
 *       navigate('/dashboard');
 *     },
 *   });
 *
 *   const handleSubmit = (credentials: LoginCredentials) => {
 *     login(credentials);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useLogin(options: UseLoginOptions = {}) {
  const { login } = useAuth();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      await login(credentials);
    },

    onSuccess: () => {
      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
