/**
 * Task edge domain model.
 * Represents a connection (dependency) between two task nodes.
 * Source must complete before target can start.
 */
export interface TaskEdge {
  readonly id: string;
  readonly source: string; // Source node ID
  readonly target: string; // Target node ID
}
