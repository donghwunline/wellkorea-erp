/**
 * File upload component for blueprint attachments.
 */

import { useRef, useState } from 'react';
import { useUploadAttachment } from '../model/use-upload-attachment';
import { fileTypeRules, MAX_FILE_SIZE } from '@/entities/blueprint-attachment';

interface AttachmentUploaderProps {
  flowId: number;
  nodeId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function AttachmentUploader({
  flowId,
  nodeId,
  onSuccess,
  onError,
  disabled = false,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const { mutate: upload, isPending } = useUploadAttachment({
    onSuccess: () => {
      onSuccess?.();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });

  const handleFile = (file: File) => {
    // Validate file type
    if (!fileTypeRules.isAllowedExtension(file.name)) {
      onError?.(
        `File type not allowed. Allowed types: ${fileTypeRules.getAllowedExtensionsString()}`
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onError?.(
        `File size exceeds maximum of ${fileTypeRules.getMaxFileSizeFormatted()}`
      );
      return;
    }

    upload({ flowId, nodeId, file });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isPending) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled || isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={fileTypeRules.getAcceptAttribute()}
        onChange={handleFileChange}
        disabled={disabled || isPending}
      />

      <div className="flex flex-col items-center gap-2">
        {isPending ? (
          <>
            <svg
              className="w-8 h-8 text-blue-500 animate-spin"
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
            <p className="text-sm text-gray-600">Uploading...</p>
          </>
        ) : (
          <>
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600">
                <span className="text-blue-600 font-medium">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {fileTypeRules.getAllowedExtensionsString()} (max{' '}
                {fileTypeRules.getMaxFileSizeFormatted()})
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
