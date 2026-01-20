/**
 * Download button for blueprint attachments.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpClient, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import { triggerDownload } from '../model/use-download-attachment';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';

interface DownloadButtonProps {
  attachment: BlueprintAttachment;
  variant?: 'icon' | 'button';
  className?: string;
  onError?: (message: string) => void;
}

export function DownloadButton({
  attachment,
  variant = 'icon',
  className = '',
  onError,
}: DownloadButtonProps) {
  const { t } = useTranslation(['items', 'common']);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const url = await httpClient.get<string>(
        `${BLUEPRINT_ENDPOINTS.url(attachment.id)}?expiryMinutes=5`
      );
      triggerDownload(url, attachment.fileName);
    } catch {
      onError?.(t('items:downloadButton.error', { fileName: attachment.fileName }));
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className={`p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 ${className}`}
        title={t('common:buttons.download')}
      >
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
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
        ) : (
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
      ) : (
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
      {t('common:buttons.download')}
    </button>
  );
}
