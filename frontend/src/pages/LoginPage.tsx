/**
 * Login Page - WellKorea ERP
 *
 * Design: Industrial Precision meets Korean Elegance
 * - Geometric grid background suggesting engineering blueprints
 * - Deep navy steel color palette with warm copper accents
 * - Clean, precise form layout with subtle depth
 *
 * Refactored following Constitution Principle VI:
 * - Pure composition layer (reuses FormField, ErrorAlert)
 * - Page-specific decorative elements kept (background, logo, animations)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Form inputs, loading, error → Local state in page
 *   Tier 2 (Page UI State): N/A (no search/filters/pagination)
 *   Tier 3 (Server State): Login API call → Direct service call via useAuth
 *   Tier 4 (App Global State): Auth → useAuth hook (wraps authStore)
 */

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { getErrorMessage, type ApiError } from '@/services';
import { ErrorAlert, FormField } from '@/components/ui';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Local UI State (Tier 1)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldFocusPassword, setShouldFocusPassword] = useState(false);

  // Ref for password field focus management
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const remembered = localStorage.getItem('rememberedUsername');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  const from = (location.state as LocationState)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Focus password field when shouldFocusPassword is set
  useEffect(() => {
    if (shouldFocusPassword && passwordInputRef.current) {
      passwordInputRef.current.focus();
      setShouldFocusPassword(false);
    }
  }, [shouldFocusPassword]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username.trim());
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      navigate(from, { replace: true });
    } catch (err) {
      const apiError = err as ApiError;

      // Clear password on authentication error (AUTH_001 = invalid credentials)
      if (apiError.errorCode === 'AUTH_001') {
        setPassword('');
        setShouldFocusPassword(true);
      }

      // Use smart error message mapping (Korean messages)
      const errorMessage = getErrorMessage(apiError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-steel-950">
      {/* Geometric Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #829ab1 1px, transparent 1px),
            linear-gradient(to bottom, #829ab1 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-steel-900/50 via-transparent to-steel-950/80" />

      {/* Decorative Blurs */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-copper-500/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/2 -translate-x-1/2 rounded-full bg-steel-600/10 blur-3xl" />

      {/* Main Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-[420px] transition-all duration-700 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Logo & Brand */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
              <div className="relative">
                <div className="h-12 w-12 rotate-45 border-2 border-copper-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-lg font-semibold tracking-tight text-copper-500">
                    WK
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">WellKorea</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-steel-400">
              Integrated Work System
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-8 shadow-elevated backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message - Using ErrorAlert component */}
              {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

              {/* Username - Using FormField component */}
              <FormField
                label="Username"
                type="text"
                id="username"
                autoComplete="username"
                value={username}
                onChange={setUsername}
                disabled={isLoading}
                placeholder="Enter your username"
              />

              {/* Password - Using FormField component */}
              <FormField
                ref={passwordInputRef}
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                disabled={isLoading}
                placeholder="Enter your password"
              />

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-steel-600 bg-steel-800 text-copper-500 focus:ring-2 focus:ring-copper-500/20 focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="ml-2.5 text-sm text-steel-400">
                  Remember me
                </label>
              </div>

              {/* Submit Button - Page-specific design kept */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-copper-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-copper-600 focus:outline-none focus:ring-2 focus:ring-copper-500/50 focus:ring-offset-2 focus:ring-offset-steel-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-steel-500">WellKorea Integrated Work System</p>
            <p className="mt-1 font-mono text-[10px] tracking-wider text-steel-600">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32">
        <div className="absolute bottom-4 left-4 h-px w-16 bg-gradient-to-r from-copper-500/40 to-transparent" />
        <div className="absolute bottom-4 left-4 h-16 w-px bg-gradient-to-t from-copper-500/40 to-transparent" />
      </div>
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32">
        <div className="absolute top-4 right-4 h-px w-16 bg-gradient-to-l from-steel-500/30 to-transparent" />
        <div className="absolute top-4 right-4 h-16 w-px bg-gradient-to-b from-steel-500/30 to-transparent" />
      </div>
    </div>
  );
}

export default LoginPage;
