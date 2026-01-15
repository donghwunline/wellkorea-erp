/**
 * Badge component displaying file type with appropriate styling.
 */

import type { AllowedFileType } from '../model/allowed-file-type';
import { fileTypeRules } from '../model/allowed-file-type';

interface FileTypeBadgeProps {
  fileType: AllowedFileType;
  className?: string;
}

/**
 * Get badge color classes based on file type.
 */
function getBadgeColorClasses(fileType: AllowedFileType): string {
  switch (fileType) {
    case 'PDF':
      return 'bg-red-100 text-red-800';
    case 'DXF':
    case 'DWG':
      return 'bg-blue-100 text-blue-800';
    case 'JPG':
    case 'PNG':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function FileTypeBadge({ fileType, className = '' }: FileTypeBadgeProps) {
  const colorClasses = getBadgeColorClasses(fileType);
  const label = fileTypeRules.getLabel(fileType);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses} ${className}`}
      title={label}
    >
      {fileType}
    </span>
  );
}
