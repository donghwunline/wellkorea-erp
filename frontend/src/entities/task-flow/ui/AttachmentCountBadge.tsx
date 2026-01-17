/**
 * Badge showing attachment count for a task node.
 * Used in TaskNodeCard to indicate files are attached.
 *
 * Note: This component lives in task-flow entity because it's only used
 * by TaskNodeComponent. Keeping it here avoids entity-to-entity imports.
 */

interface AttachmentCountBadgeProps {
  count: number;
  className?: string;
}

export function AttachmentCountBadge({
  count,
  className = '',
}: Readonly<AttachmentCountBadgeProps>) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 ${className}`}
      title={`${count} attachment${count === 1 ? '' : 's'}`}
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
      {count}
    </span>
  );
}
