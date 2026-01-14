/**
 * 404 Not Found page component.
 * Displayed when a route doesn't match any defined paths.
 */

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-steel-950">
      {/* Background Grid */}
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

      <div className="relative text-center">
        <div className="mb-6 font-mono text-8xl font-bold text-steel-700">404</div>
        <h1 className="text-2xl font-semibold text-white">Page Not Found</h1>
        <p className="mt-2 text-steel-400">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-copper-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
