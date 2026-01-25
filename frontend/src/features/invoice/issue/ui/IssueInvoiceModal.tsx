/**
 * Modal for issuing an invoice with a tax invoice document attachment.
 */

import { useState, useCallback } from 'react';
import { Modal, ModalActions, Button, Alert, FileUploader } from '@/shared/ui';
import { useIssueInvoice } from '../model/use-issue-invoice';

interface IssueInvoiceModalProps {
  /** ID of the invoice to issue */
  invoiceId: number;
  /** Invoice number for display */
  invoiceNumber: string;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when invoice is successfully issued */
  onSuccess?: () => void;
}

export function IssueInvoiceModal({
  invoiceId,
  invoiceNumber,
  isOpen,
  onClose,
  onSuccess,
}: IssueInvoiceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    mutate: issueInvoice,
    isPending,
    error,
    reset,
  } = useIssueInvoice({
    onSuccess: () => {
      // Reset state
      setFile(null);
      setValidationError(null);
      reset();
      // Notify parent
      onSuccess?.();
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setValidationError(null);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!file) {
      setValidationError('세금계산서 파일을 선택해 주세요.');
      return;
    }

    issueInvoice({ invoiceId, file });
  }, [invoiceId, file, issueInvoice]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isPending) return; // Don't close while uploading

    setFile(null);
    setValidationError(null);
    reset();
    onClose();
  }, [isPending, onClose, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="세금계산서 발행"
      size="md"
      closeOnBackdrop={!isPending}
      closeOnEsc={!isPending}
    >
      <div className="space-y-6">
        {/* Invoice info */}
        <div className="rounded-lg border border-steel-700 bg-steel-800/50 p-4">
          <p className="text-sm text-steel-400">청구서 번호</p>
          <p className="text-lg font-semibold text-white">{invoiceNumber}</p>
        </div>

        {/* Instructions */}
        <Alert variant="info">
          세금계산서를 발행하려면 세금계산서 사본 파일(JPG, PNG 또는 PDF)을 업로드해 주세요.
          업로드된 파일은 청구서 기록에 첨부됩니다.
        </Alert>

        {/* File uploader */}
        <div>
          <label className="mb-2 block text-sm font-medium text-steel-300">
            세금계산서 파일 <span className="text-red-400">*</span>
          </label>
          <FileUploader
            file={file}
            onFileSelect={handleFileSelect}
            error={validationError}
            isUploading={isPending}
            disabled={isPending}
            accept="documents"
          />
        </div>

        {/* API error */}
        {error && (
          <Alert variant="error">
            {error instanceof Error ? error.message : '세금계산서 발행 중 오류가 발생했습니다.'}
          </Alert>
        )}
      </div>

      {/* Actions */}
      <ModalActions>
        <Button variant="ghost" onClick={handleClose} disabled={isPending}>
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!file || isPending}
          isLoading={isPending}
        >
          세금계산서 발행
        </Button>
      </ModalActions>
    </Modal>
  );
}

IssueInvoiceModal.displayName = 'IssueInvoiceModal';
