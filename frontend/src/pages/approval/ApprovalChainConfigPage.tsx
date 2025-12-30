/**
 * Approval Chain Configuration Page - Admin Only
 *
 * Allows administrators to configure approval chain templates.
 * Shows existing chains and allows editing levels.
 *
 * Route: /admin/approval-chains
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Edit mode, selected chain
 * - Tier 2 (Page UI State): Pagination (if needed)
 * - Tier 3 (Server State): Chain templates -> useApprovalChainConfig hook
 * - Tier 4 (App Global State): Not used directly here
 */

import { useCallback, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  LoadingState,
  Modal,
  PageHeader,
  Spinner,
  Table,
} from '@/shared/ui';
import { useApprovalChainConfig } from '@/components/features/approval';
import { UserCombobox } from '@/components/features/shared/selectors';
import type { ChainLevel, ChainLevelRequest, ChainTemplate } from '@/services';

interface EditingChain {
  template: ChainTemplate;
  levels: ChainLevelRequest[];
}

export function ApprovalChainConfigPage() {
  // Server state via hook
  const {
    templates,
    isLoading,
    error: fetchError,
    isSaving,
    saveError,
    refetch,
    updateChainLevels,
    clearSaveError,
  } = useApprovalChainConfig();

  // Local UI State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingChain, setEditingChain] = useState<EditingChain | null>(null);

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Handle edit chain
  const handleEditChain = useCallback((template: ChainTemplate) => {
    setEditingChain({
      template,
      levels: template.levels.map(level => ({
        levelOrder: level.levelOrder,
        levelName: level.levelName,
        approverUserId: level.approverUserId,
        isRequired: level.isRequired,
      })),
    });
  }, []);

  // Handle add level
  const handleAddLevel = useCallback(() => {
    if (!editingChain) return;

    const nextLevel = editingChain.levels.length + 1;
    setEditingChain({
      ...editingChain,
      levels: [
        ...editingChain.levels,
        {
          levelOrder: nextLevel,
          levelName: `Level ${nextLevel}`,
          approverUserId: 0,
          isRequired: true,
        },
      ],
    });
  }, [editingChain]);

  // Handle remove level
  const handleRemoveLevel = useCallback(
    (index: number) => {
      if (!editingChain) return;

      const newLevels = editingChain.levels
        .filter((_, i) => i !== index)
        .map((level, i) => ({ ...level, levelOrder: i + 1, levelName: `Level ${i + 1}` }));

      setEditingChain({
        ...editingChain,
        levels: newLevels,
      });
    },
    [editingChain]
  );

  // Handle approver change
  const handleApproverChange = useCallback(
    (index: number, approverUserId: number | null) => {
      if (!editingChain || approverUserId === null) return;

      const newLevels = [...editingChain.levels];
      newLevels[index] = { ...newLevels[index], approverUserId };

      setEditingChain({
        ...editingChain,
        levels: newLevels,
      });
    },
    [editingChain]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!editingChain) return;

    // Validate
    if (editingChain.levels.some(l => !l.approverUserId || l.approverUserId === 0)) {
      setError('All levels must have an approver assigned');
      return;
    }

    try {
      await updateChainLevels(editingChain.template.id, editingChain.levels);
      showSuccess('Approval chain updated successfully');
      setEditingChain(null);
    } catch {
      // Error handled by hook
    }
  }, [editingChain, updateChainLevels, showSuccess]);

  // Format level display
  const formatLevels = (levels: ChainLevel[]): string => {
    if (levels.length === 0) return 'No levels configured';
    return `${levels.length} level${levels.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="결재 설정"
          description="Configure approval workflows for different entity types"
        />
      </PageHeader>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {(error || saveError) && (
        <Alert
          variant="error"
          className="mb-6"
          onClose={() => {
            setError(null);
            clearSaveError();
          }}
        >
          {error || saveError}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <LoadingState message="Loading approval chain templates..." />
        </Card>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <Card className="p-8 text-center">
          <p className="text-red-400">{fetchError}</p>
          <button onClick={refetch} className="mt-4 text-sm text-copper-500 hover:underline">
            Retry
          </button>
        </Card>
      )}

      {/* Templates Table */}
      {!isLoading && !fetchError && (
        <Card variant="table">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Entity Type</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Approval Levels</Table.HeaderCell>
                <Table.HeaderCell>Approvers</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {templates.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center text-steel-400">
                    No approval chain templates configured.
                  </Table.Cell>
                </Table.Row>
              ) : (
                templates.map(template => (
                  <Table.Row key={template.id}>
                    <Table.Cell>
                      <Badge variant="info">{template.entityType}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-medium text-white">{template.name}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-steel-300">{formatLevels(template.levels)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {template.levels.map(level => (
                          <span
                            key={level.levelOrder}
                            className="rounded bg-steel-700/50 px-2 py-0.5 text-xs text-steel-300"
                          >
                            L{level.levelOrder}: {level.approverUserName}
                          </span>
                        ))}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end">
                        <IconButton
                          onClick={() => handleEditChain(template)}
                          aria-label="Edit chain"
                          title="Edit approval chain"
                        >
                          <Icon name="pencil" className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingChain}
        onClose={() => setEditingChain(null)}
        title={`Edit Approval Chain: ${editingChain?.template.name}`}
        size="lg"
      >
        {editingChain && (
          <div className="space-y-4">
            {/* Chain Info */}
            <div className="rounded-lg bg-steel-800/50 p-3">
              <span className="text-sm text-steel-400">Entity Type: </span>
              <Badge variant="info">{editingChain.template.entityType}</Badge>
            </div>

            {/* Levels */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">Approval Levels</h4>
                <Button variant="secondary" size="sm" onClick={handleAddLevel} disabled={isSaving}>
                  <Icon name="plus" className="mr-1 h-4 w-4" />
                  Add Level
                </Button>
              </div>

              {editingChain.levels.length === 0 ? (
                <p className="text-sm text-steel-400">
                  No levels configured. Add at least one approval level.
                </p>
              ) : (
                <div className="space-y-3">
                  {editingChain.levels.map((level, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-steel-700/50 bg-steel-800/30 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-copper-500/20 text-sm font-medium text-copper-400">
                        {level.levelOrder}
                      </div>
                      <div className="flex-1">
                        <UserCombobox
                          value={level.approverUserId || null}
                          onChange={value => handleApproverChange(index, value)}
                          placeholder="Select approver..."
                          disabled={isSaving}
                        />
                      </div>
                      <IconButton
                        onClick={() => handleRemoveLevel(index)}
                        variant="danger"
                        disabled={isSaving}
                        aria-label="Remove level"
                        title="Remove level"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-steel-500">
              Approvals will be processed in order from Level 1 to the highest level. Each level
              must approve before moving to the next.
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-steel-700/50 pt-4">
              <Button variant="secondary" onClick={() => setEditingChain(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || editingChain.levels.length === 0}>
                {isSaving ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
