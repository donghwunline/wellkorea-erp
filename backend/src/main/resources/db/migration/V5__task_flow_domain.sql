-- V5: TaskFlow DAG domain for project task visualization
-- Provides a flexible DAG-based task management per project for React Flow.

-- =====================================================================
-- TASKFLOW AGGREGATE
-- =====================================================================

CREATE TABLE task_flows (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_nodes (
    flow_id         BIGINT NOT NULL REFERENCES task_flows(id) ON DELETE CASCADE,
    node_id         VARCHAR(36) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    assignee        VARCHAR(100),
    deadline        DATE,
    progress        INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    position_x      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    position_y      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    PRIMARY KEY (flow_id, node_id)
);

CREATE TABLE task_edges (
    flow_id         BIGINT NOT NULL REFERENCES task_flows(id) ON DELETE CASCADE,
    edge_id         VARCHAR(36) NOT NULL,
    source_node_id  VARCHAR(36) NOT NULL,
    target_node_id  VARCHAR(36) NOT NULL,
    PRIMARY KEY (flow_id, edge_id)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_task_nodes_flow ON task_nodes(flow_id);
CREATE INDEX idx_task_edges_flow ON task_edges(flow_id);
CREATE INDEX idx_task_edges_source ON task_edges(source_node_id);
CREATE INDEX idx_task_edges_target ON task_edges(target_node_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE task_flows IS 'DAG-based task flow per project for React Flow visualization';
COMMENT ON COLUMN task_flows.project_id IS 'One-to-one relationship with project';

COMMENT ON TABLE task_nodes IS 'Task nodes collection owned by TaskFlow aggregate';
COMMENT ON COLUMN task_nodes.node_id IS 'UUID for React Flow node identification';
COMMENT ON COLUMN task_nodes.progress IS 'Completion percentage (0-100)';
COMMENT ON COLUMN task_nodes.position_x IS 'X coordinate on React Flow canvas';
COMMENT ON COLUMN task_nodes.position_y IS 'Y coordinate on React Flow canvas';

COMMENT ON TABLE task_edges IS 'Task edges collection owned by TaskFlow aggregate';
COMMENT ON COLUMN task_edges.edge_id IS 'UUID for React Flow edge identification';
COMMENT ON COLUMN task_edges.source_node_id IS 'Source node ID (references task_nodes.node_id)';
COMMENT ON COLUMN task_edges.target_node_id IS 'Target node ID (references task_nodes.node_id)';
