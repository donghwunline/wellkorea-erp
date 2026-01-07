/**
 * Hook for managing task node edit state.
 * Provides form state and validation for editing a single task node.
 */

import { useState, useCallback } from 'react';
import type { TaskNode } from '@/entities/task-flow';

/**
 * Form state for editing a task node.
 */
export interface EditNodeFormState {
  title: string;
  assignee: string;
  deadline: string;
  progress: number;
}

/**
 * Validation errors for the form.
 */
export interface EditNodeFormErrors {
  title?: string;
  progress?: string;
}

/**
 * Hook return type.
 */
export interface UseEditNodeReturn {
  formState: EditNodeFormState;
  errors: EditNodeFormErrors;
  setTitle: (value: string) => void;
  setAssignee: (value: string) => void;
  setDeadline: (value: string) => void;
  setProgress: (value: number) => void;
  validate: () => boolean;
  reset: (node?: TaskNode) => void;
  toTaskNode: (id: string, position: { x: number; y: number }) => TaskNode;
}

const initialState: EditNodeFormState = {
  title: '',
  assignee: '',
  deadline: '',
  progress: 0,
};

/**
 * Hook for managing the edit node form state.
 */
export function useEditNode(initialNode?: TaskNode): UseEditNodeReturn {
  const [formState, setFormState] = useState<EditNodeFormState>(() => {
    if (initialNode) {
      return {
        title: initialNode.title,
        assignee: initialNode.assignee ?? '',
        deadline: initialNode.deadline ?? '',
        progress: initialNode.progress,
      };
    }
    return initialState;
  });

  const [errors, setErrors] = useState<EditNodeFormErrors>({});

  const setTitle = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, title: value }));
    setErrors(prev => ({ ...prev, title: undefined }));
  }, []);

  const setAssignee = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, assignee: value }));
  }, []);

  const setDeadline = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, deadline: value }));
  }, []);

  const setProgress = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setFormState(prev => ({ ...prev, progress: clampedValue }));
    setErrors(prev => ({ ...prev, progress: undefined }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: EditNodeFormErrors = {};

    if (!formState.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formState.progress < 0 || formState.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const reset = useCallback((node?: TaskNode) => {
    if (node) {
      setFormState({
        title: node.title,
        assignee: node.assignee ?? '',
        deadline: node.deadline ?? '',
        progress: node.progress,
      });
    } else {
      setFormState(initialState);
    }
    setErrors({});
  }, []);

  const toTaskNode = useCallback(
    (id: string, position: { x: number; y: number }): TaskNode => ({
      id,
      title: formState.title.trim(),
      assignee: formState.assignee.trim() || null,
      deadline: formState.deadline || null,
      progress: formState.progress,
      position,
    }),
    [formState]
  );

  return {
    formState,
    errors,
    setTitle,
    setAssignee,
    setDeadline,
    setProgress,
    validate,
    reset,
    toTaskNode,
  };
}
