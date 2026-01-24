/**
 * Document Panel Widget
 *
 * Displays all documents for a project grouped by type:
 * - Blueprint attachments (from TaskFlow nodes)
 * - Delivery photos (from DELIVERED deliveries)
 * - Invoice documents (future)
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ProjectDocument, ProjectDocumentType } from '@/shared/domain';
import { projectDocumentRules } from '@/shared/domain';
import { triggerDownload } from '@/features/blueprint/download';
import { Card, Icon, Spinner } from '@/shared/ui';
import { documentQueries } from '../api/document.queries';

export interface DocumentPanelProps {
  /** Project ID to display documents for */
  readonly projectId: number;
}

export function DocumentPanel({ projectId }: DocumentPanelProps) {
  const { t } = useTranslation('widgets');
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery(documentQueries.byProject(projectId));

  // Group documents by type
  const groupedDocuments = projectDocumentRules.groupByType(documents);
  const blueprints = groupedDocuments.BLUEPRINT;
  const deliveryPhotos = groupedDocuments.DELIVERY_PHOTO;
  // Future: const invoices = groupedDocuments.INVOICE;

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
  if (documents.length === 0) {
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

  // Content state - grouped document sections
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
        <h3 className="font-medium text-white">{t('documentPanel.titleWithCount', { count: documents.length })}</h3>
        <p className="mt-1 text-sm text-steel-400">
          {t('documentPanel.description')}
        </p>
      </div>

      {/* Blueprint section */}
      {blueprints.length > 0 && (
        <DocumentSection
          title={t('documentPanel.sections.blueprints')}
          documents={blueprints}
          documentType="BLUEPRINT"
        />
      )}

      {/* Delivery photos section */}
      {deliveryPhotos.length > 0 && (
        <DocumentSection
          title={t('documentPanel.sections.deliveryPhotos')}
          documents={deliveryPhotos}
          documentType="DELIVERY_PHOTO"
        />
      )}

      {/* Future: Invoice documents section */}
    </Card>
  );
}

/**
 * Document section with title and list of documents.
 */
interface DocumentSectionProps {
  readonly title: string;
  readonly documents: readonly ProjectDocument[];
  readonly documentType: ProjectDocumentType;
}

function DocumentSection({ title, documents, documentType }: DocumentSectionProps) {
  return (
    <div className="border-b border-steel-700/30 last:border-b-0">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-steel-800/30">
        <DocumentTypeIcon documentType={documentType} />
        <span className="text-sm font-medium text-steel-300">{title}</span>
        <span className="text-xs text-steel-500">({documents.length})</span>
      </div>

      {/* Document list */}
      <div className="divide-y divide-steel-700/50">
        {documents.map(doc => (
          <DocumentItem key={`${doc.documentType}-${doc.id}`} document={doc} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single document item with download button.
 */
interface DocumentItemProps {
  readonly document: ProjectDocument;
}

function DocumentItem({ document }: DocumentItemProps) {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    setIsLoading(true);
    // Use the pre-generated download URL from the API response
    triggerDownload(document.downloadUrl, document.fileName);
    // Reset loading state after a brief delay
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-steel-800/30">
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon fileType={document.fileType} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{document.fileName}</p>
          <div className="flex items-center gap-2 text-xs text-steel-400">
            <span>{projectDocumentRules.formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <span>{document.uploadedByName}</span>
            <span>•</span>
            <span className="text-steel-500">{document.sourceLabel}</span>
          </div>
        </div>
      </div>

      <div className="ml-4 flex items-center">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
          title={t('buttons.download')}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Icon for document type (section header).
 */
function DocumentTypeIcon({ documentType }: Readonly<{ documentType: ProjectDocumentType }>) {
  const getColor = () => {
    switch (documentType) {
      case 'BLUEPRINT':
        return 'text-blue-500';
      case 'DELIVERY_PHOTO':
        return 'text-green-500';
      case 'INVOICE':
        return 'text-orange-500';
      default:
        return 'text-steel-500';
    }
  };

  const getIcon = () => {
    switch (documentType) {
      case 'BLUEPRINT':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        );
      case 'DELIVERY_PHOTO':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        );
      case 'INVOICE':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          />
        );
      default:
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        );
    }
  };

  return (
    <svg className={`h-4 w-4 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {getIcon()}
    </svg>
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
