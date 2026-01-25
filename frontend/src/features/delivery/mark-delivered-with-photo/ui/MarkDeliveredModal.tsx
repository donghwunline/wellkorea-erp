/**
 * Modal for marking a delivery as delivered with a proof-of-delivery photo.
 */

import { useState, useCallback } from 'react';
import { Modal, ModalActions, Button, Alert } from '@/shared/ui';
import { PhotoUploader } from './PhotoUploader';
import { useMarkDeliveredWithPhoto } from '../model/use-mark-delivered-with-photo';

interface MarkDeliveredModalProps {
  /** ID of the delivery to mark as delivered */
  deliveryId: number;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when delivery is successfully marked as delivered */
  onSuccess?: () => void;
}

export function MarkDeliveredModal({
  deliveryId,
  isOpen,
  onClose,
  onSuccess,
}: MarkDeliveredModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: markDelivered, isPending, error, reset } = useMarkDeliveredWithPhoto({
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
      setValidationError('배송 확인 사진을 선택해 주세요.');
      return;
    }

    markDelivered({ deliveryId, file });
  }, [deliveryId, file, markDelivered]);

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
      title="배송 완료 확인"
      size="md"
      closeOnBackdrop={!isPending}
      closeOnEsc={!isPending}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <Alert variant="info">
          배송 완료를 확인하려면 배송 사진을 업로드해 주세요.
          사진은 배송 기록에 저장됩니다.
        </Alert>

        {/* Photo uploader */}
        <div>
          <label className="mb-2 block text-sm font-medium text-steel-300">
            배송 확인 사진 <span className="text-red-400">*</span>
          </label>
          <PhotoUploader
            file={file}
            onFileSelect={handleFileSelect}
            error={validationError}
            isUploading={isPending}
            disabled={isPending}
          />
        </div>

        {/* API error */}
        {error && (
          <Alert variant="error">
            {error instanceof Error ? error.message : '배송 완료 처리 중 오류가 발생했습니다.'}
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
          배송 완료
        </Button>
      </ModalActions>
    </Modal>
  );
}

MarkDeliveredModal.displayName = 'MarkDeliveredModal';
