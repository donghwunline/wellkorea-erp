/**
 * Purchase Order Timeline component.
 *
 * Displays the PO lifecycle as a horizontal timeline:
 * DRAFT → SENT → CONFIRMED → RECEIVED
 * With CANCELED shown as a branching path if applicable.
 */

import { Icon } from '@/shared/ui';
import { PurchaseOrderStatus, PurchaseOrderStatusConfig } from '../model/purchase-order-status';
import type { PurchaseOrderStatus as PurchaseOrderStatusType } from '../model/purchase-order-status';

interface PurchaseOrderTimelineProps {
  /** Current status of the purchase order */
  status: PurchaseOrderStatusType;
}

/**
 * Status flow order (excluding CANCELED which branches off).
 */
const STATUS_FLOW: PurchaseOrderStatusType[] = [
  PurchaseOrderStatus.DRAFT,
  PurchaseOrderStatus.SENT,
  PurchaseOrderStatus.CONFIRMED,
  PurchaseOrderStatus.RECEIVED,
];

/**
 * Get the current step index for timeline rendering.
 */
function getStepIndex(status: PurchaseOrderStatusType): number {
  const index = STATUS_FLOW.indexOf(status);
  return index >= 0 ? index : -1;
}

/**
 * Get step state: 'completed' | 'current' | 'pending'.
 */
type StepState = 'completed' | 'current' | 'pending';

function getStepState(stepStatus: PurchaseOrderStatusType, currentStatus: PurchaseOrderStatusType): StepState {
  // If canceled, show only the step where it was canceled as current
  if (currentStatus === PurchaseOrderStatus.CANCELED) {
    return 'pending';
  }

  const currentIndex = getStepIndex(currentStatus);
  const stepIndex = getStepIndex(stepStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

/**
 * Get icon for each status step.
 */
function getStepIcon(status: PurchaseOrderStatusType): 'document' | 'paper-airplane' | 'check-circle' | 'truck' {
  switch (status) {
    case PurchaseOrderStatus.DRAFT:
      return 'document';
    case PurchaseOrderStatus.SENT:
      return 'paper-airplane';
    case PurchaseOrderStatus.CONFIRMED:
      return 'check-circle';
    case PurchaseOrderStatus.RECEIVED:
      return 'truck';
    default:
      return 'document';
  }
}

/**
 * Get CSS classes for step indicator based on state.
 */
function getStepClasses(state: StepState): string {
  switch (state) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30';
    case 'current':
      return 'bg-copper-500/20 text-copper-400 ring-2 ring-copper-500/50';
    case 'pending':
    default:
      return 'bg-steel-700/50 text-steel-500';
  }
}

/**
 * Get CSS classes for connector line based on whether the step is completed.
 */
function getConnectorClasses(isCompleted: boolean): string {
  return isCompleted ? 'bg-green-500/50' : 'bg-steel-700';
}

/**
 * Horizontal timeline showing PO status progression.
 */
export function PurchaseOrderTimeline({ status }: Readonly<PurchaseOrderTimelineProps>) {
  const isCanceled = status === PurchaseOrderStatus.CANCELED;
  const currentStepIndex = getStepIndex(status);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-steel-400">Order Progress</h4>

      {/* Canceled Banner */}
      {isCanceled && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <Icon name="x-mark" className="h-4 w-4" />
          <span>This order has been canceled</span>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-center justify-between">
        {STATUS_FLOW.map((stepStatus, index) => {
          const state = getStepState(stepStatus, status);
          const config = PurchaseOrderStatusConfig[stepStatus];
          const isLastStep = index === STATUS_FLOW.length - 1;
          const isConnectorCompleted = index < currentStepIndex;

          return (
            <div key={stepStatus} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${getStepClasses(state)}`}
                  title={config.description}
                >
                  {state === 'completed' ? (
                    <Icon name="check" className="h-5 w-5" />
                  ) : (
                    <Icon name={getStepIcon(stepStatus)} className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    state === 'current'
                      ? 'text-copper-400'
                      : state === 'completed'
                        ? 'text-green-400'
                        : 'text-steel-500'
                  }`}
                >
                  {config.labelKo}
                </span>
              </div>

              {/* Connector Line */}
              {!isLastStep && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${getConnectorClasses(isConnectorCompleted)}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
