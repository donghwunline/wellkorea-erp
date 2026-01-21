/**
 * Document Panel Widget
 *
 * Displays all BlueprintAttachments for a project (read-only, download only).
 * Shows attachments from all TaskFlow nodes associated with the project.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';
import { blueprintQueries } from '@/entities/blueprint-attachment';
import { DownloadButton } from '@/features/blueprint/download';
import { Card, Icon, Spinner } from '@/shared/ui';

export interface DocumentPanelProps {
  /** Project ID to display attachments for */
  readonly projectId: number;
}

export function DocumentPanel({ projectId }: DocumentPanelProps) {
  const { t } = useTranslation('widgets');
  const {
    data: attachments = [],
    isLoading,
    error,
  } = useQuery(blueprintQueries.byProject(projectId));

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Spinner size="lg" label={t('documentPanel.loadingLabel')} />
        <p className="mt-4 text-steel-400">{t('documentPanel.loading')}</p>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-12 text-center">
        <Icon name="warning" className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-white">{t('documentPanel.loadError')}</h3>
        <p className="mt-2 text-steel-500">{error.message}</p>
      </Card>
    );
  }

  // Empty state
  if (attachments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">{t('documentPanel.emptyTitle')}</h3>
        <p className="mt-2 text-steel-500">{t('documentPanel.emptyDescription')}</p>
        <p className="mt-1 text-sm text-steel-600">
          {t('documentPanel.emptyHint')}
        </p>
      </Card>
    );
  }

  // Content state - list attachments
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
        <h3 className="font-medium text-white">{t('documentPanel.titleWithCount', { count: attachments.length })}</h3>
        <p className="mt-1 text-sm text-steel-400">
          {t('documentPanel.description')}
        </p>
      </div>

      {/* Attachment list */}
      <div className="divide-y divide-steel-700/50">
        {attachments.map(attachment => (
          <DocumentItem key={attachment.id} attachment={attachment} />
        ))}
      </div>
    </Card>
  );
}

/**
 * Single document item with download button.
 */
interface DocumentItemProps {
  attachment: BlueprintAttachment;
}

function DocumentItem({ attachment }: Readonly<DocumentItemProps>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-steel-800/30">
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon fileType={attachment.fileType} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{attachment.fileName}</p>
          <div className="flex items-center gap-2 text-xs text-steel-400">
            <span>{attachment.formattedFileSize}</span>
            <span>•</span>
            <span>{attachment.uploadedByName}</span>
          </div>
        </div>
      </div>

      <div className="ml-4 flex items-center">
        <DownloadButton attachment={attachment} />
      </div>
    </div>
  );
}

/**
 * File type icon component.
 */
function FileTypeIcon({ fileType }: Readonly<{ fileType: string }>) {
  const getColor = () => {
    switch (fileType) {
      case 'PDF':
        return 'text-red-500';
      case 'DXF':
      case 'DWG':
        return 'text-blue-500';
      case 'JPG':
      case 'PNG':
        return 'text-green-500';
      default:
        return 'text-steel-500';
    }
  };

  return (
    <div className={`flex-shrink-0 ${getColor()}`}>
      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
      </svg>
    </div>
  );
}
