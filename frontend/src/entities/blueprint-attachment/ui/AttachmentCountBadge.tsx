/**
 * Badge showing attachment count for a task node.
 * Used in TaskNodeCard to indicate files are attached.
 */

interface AttachmentCountBadgeProps {
  count: number;
  className?: string;
}

export function AttachmentCountBadge({
  count,
  className = '',
}: AttachmentCountBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium ${className}`}
      title={`${count} attachment${count === 1 ? '' : 's'}`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
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
