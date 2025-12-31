/**
 * Auth Entity - Public API.
 *
 * Exports auth domain types, store, and API.
 *
 * @example
 * ```tsx
 * import { useAuthStore, type LoginCredentials } from '@/entities/auth';
 *
 * function LoginForm() {
 *   const login = useAuthStore(state => state.login);
 *
 *   const handleSubmit = async (credentials: LoginCredentials) => {
 *     await login(credentials);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */

// ==================== MODEL ====================
export type {
  AuthState,
  AuthActions,
  AuthStore,
  LoginCredentials,
} from './model';

// ==================== API ====================
export type {
  LoginRequestDTO,
  LoginResponseDTO,
  LoginUserDTO,
} from './api';

export { authMapper, type LoginResult } from './api';
export { authApi } from './api';

// ==================== STORE ====================
export { authEvents, type AuthEvent } from './store';
export { useAuthStore } from './store';

// ==================== LIB ====================
export { authStorage } from './lib';
