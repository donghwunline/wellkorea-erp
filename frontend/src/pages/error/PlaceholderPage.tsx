/**
 * Placeholder page for features not yet implemented.
 * Used as a temporary stand-in during development.
 */

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: Readonly<PlaceholderPageProps>) {
  return (
    <div className="min-h-screen bg-steel-950 p-8">
      <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-12 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-steel-400">This feature will be implemented in a future phase.</p>
      </div>
    </div>
  );
}
