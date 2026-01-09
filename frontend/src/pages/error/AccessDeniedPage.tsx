/**
 * Access Denied page component.
 * Displayed when user lacks required role(s) to access a protected route.
 */

import type { RoleName } from '@/entities/user';

interface AccessDeniedPageProps {
  requiredRoles: RoleName[];
}

export function AccessDeniedPage({ requiredRoles }: Readonly<AccessDeniedPageProps>) {
  const rolesDisplay = requiredRoles.join(', ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-steel-950">
      <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-8 max-w-md w-full text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-steel-400 mb-4">You do not have permission to access this page.</p>
        <p className="text-sm text-steel-500">
          Required role{requiredRoles.length > 1 ? 's' : ''}:{' '}
          <span className="font-mono text-copper-400">{rolesDisplay}</span>
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
