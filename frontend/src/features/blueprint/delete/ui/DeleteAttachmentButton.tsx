/**
 * Delete button for blueprint attachments with confirmation.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteAttachment } from '../model/use-delete-attachment';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';

interface DeleteAttachmentButtonProps {
  attachment: BlueprintAttachment;
  variant?: 'icon' | 'button';
  className?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function DeleteAttachmentButton({
  attachment,
  variant = 'icon',
  className = '',
  onSuccess,
  onError,
}: DeleteAttachmentButtonProps) {
  const { t } = useTranslation(['items', 'common']);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: deleteMutation, isPending } = useDeleteAttachment({
    onSuccess: () => {
      setShowConfirm(false);
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation({ id: attachment.id });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? t('items:deleteAttachmentButton.deleting') : t('common:buttons.confirm')}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {t('common:buttons.cancel')}
        </button>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ${className}`}
        title={t('common:buttons.delete')}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      {t('common:buttons.delete')}
    </button>
  );
}
