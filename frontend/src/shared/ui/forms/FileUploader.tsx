/**
 * Reusable file uploader component with drag-and-drop and preview.
 * Supports images (JPG, PNG), documents (JPG, PNG, PDF), or all.
 */

import { useCallback, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { attachmentRules, ATTACHMENT_MAX_SIZE } from '@/shared/domain';

export type FileAcceptType = 'images' | 'documents' | 'all';

export interface FileUploaderProps {
  /** Currently selected file */
  file: File | null;
  /** Called when file is selected */
  onFileSelect: (file: File | null) => void;
  /** Validation error message */
  error?: string | null;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Whether component is disabled */
  disabled?: boolean;
  /** File types to accept: 'images' | 'documents' | 'all' */
  accept?: FileAcceptType;
}

/**
 * Get the accept attribute for file input based on accept type.
 */
function getAcceptAttribute(accept: FileAcceptType): string {
  switch (accept) {
    case 'images':
      return attachmentRules.getImageAcceptAttribute();
    case 'documents':
    case 'all':
      return attachmentRules.getAllAcceptAttribute();
  }
}

/**
 * Validate file based on accept type.
 */
function isFileAllowed(fileName: string, accept: FileAcceptType): boolean {
  switch (accept) {
    case 'images':
      return attachmentRules.isAllowedImage(fileName);
    case 'documents':
    case 'all':
      return attachmentRules.isAllowed(fileName);
  }
}

/**
 * Check if file is an image (for preview).
 */
function isImageFile(fileName: string): boolean {
  return attachmentRules.isAllowedImage(fileName);
}

/**
 * Get the file type label for display.
 */
function getFileTypeLabel(accept: FileAcceptType): string {
  switch (accept) {
    case 'images':
      return 'JPG, PNG';
    case 'documents':
    case 'all':
      return 'JPG, PNG, PDF';
  }
}

export function FileUploader({
  file,
  onFileSelect,
  error,
  isUploading = false,
  disabled = false,
  accept = 'images',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) {
        setPreview(null);
        onFileSelect(null);
        return;
      }

      // Validate file type
      if (!isFileAllowed(selectedFile.name, accept)) {
        onFileSelect(null);
        return;
      }

      // Validate file size
      if (!attachmentRules.isValidSize(selectedFile.size)) {
        onFileSelect(null);
        return;
      }

      // Create preview for images only
      if (isImageFile(selectedFile.name)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }

      onFileSelect(selectedFile);
    },
    [onFileSelect, accept]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  // Handle remove file
  const handleRemove = useCallback(() => {
    setPreview(null);
    onFileSelect(null);
  }, [onFileSelect]);

  // Determine if the file is an image (for preview)
  const isImage = file && isImageFile(file.name);

  return (
    <div className="space-y-4">
      {!file ? (
        // Upload area
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
            isDragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-steel-600 bg-steel-800/50 hover:border-brand-500 hover:bg-steel-800',
            (disabled || isUploading) && 'cursor-not-allowed opacity-50',
            error && 'border-red-500'
          )}
        >
          <input
            type="file"
            accept={getAcceptAttribute(accept)}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="sr-only"
          />

          {/* Upload icon */}
          <div className="mb-4 rounded-full bg-steel-700 p-4">
            {accept === 'images' ? (
              <svg
                className="h-8 w-8 text-steel-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg
                className="h-8 w-8 text-steel-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>

          <p className="mb-1 text-sm text-steel-300">
            <span className="font-semibold text-brand-400">클릭하여 파일 선택</span>
            <span className="text-steel-400"> 또는 드래그하여 업로드</span>
          </p>
          <p className="text-xs text-steel-500">
            {getFileTypeLabel(accept)} (최대 {attachmentRules.formatFileSize(ATTACHMENT_MAX_SIZE)})
          </p>
        </label>
      ) : (
        // Preview area
        <div className="relative overflow-hidden rounded-xl border border-steel-700 bg-steel-800">
          {/* Image preview or PDF icon */}
          <div className="flex items-center justify-center bg-steel-900 p-4">
            {isImage && preview ? (
              <img
                src={preview}
                alt="파일 미리보기"
                className="max-h-64 rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center py-8">
                {/* PDF icon */}
                <svg
                  className="h-16 w-16 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="mt-2 text-sm font-medium text-steel-300">PDF</span>
              </div>
            )}
          </div>

          {/* File info bar */}
          <div className="flex items-center justify-between border-t border-steel-700 bg-steel-800 p-3">
            <div className="flex items-center gap-3">
              {/* File type icon */}
              <div className="rounded-lg bg-steel-700 p-2">
                {isImage ? (
                  <svg
                    className="h-5 w-5 text-brand-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>

              {/* File name and size */}
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-steel-400">
                  {attachmentRules.formatFileSize(file.size)}
                </p>
              </div>
            </div>

            {/* Remove button */}
            {!isUploading && !disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-700 hover:text-red-400"
                aria-label="파일 제거"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-steel-900/80">
              <div className="flex flex-col items-center">
                <svg
                  className="h-8 w-8 animate-spin text-brand-400"
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
                <p className="mt-2 text-sm text-steel-300">업로드 중...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

FileUploader.displayName = 'FileUploader';
