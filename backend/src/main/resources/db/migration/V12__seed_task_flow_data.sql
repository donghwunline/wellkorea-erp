-- V12__seed_task_flow_data.sql
-- Seed data for TaskFlow visualization testing
-- Creates comprehensive DAG structures for existing projects

-- ============================================================================
-- TaskFlow for Project 1 (Samsung HQ - Linear Flow)
-- Pattern: Simple linear progression
-- ============================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

-- Nodes for Project 1 (Linear: Design → Development → Testing → Deployment)
INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y)
VALUES
    (1, 'node-1-1', '설계', '김설계', CURRENT_DATE - INTERVAL '5 days', 100, 100, 100),
    (1, 'node-1-2', '개발', '박개발', CURRENT_DATE + INTERVAL '3 days', 75, 350, 100),
    (1, 'node-1-3', '테스트', '이품질', CURRENT_DATE + INTERVAL '10 days', 25, 600, 100),
    (1, 'node-1-4', '출하', '최출하', CURRENT_DATE + INTERVAL '15 days', 0, 850, 100)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 1 (Linear chain)
INSERT INTO task_edges (flow_id, edge_id, source_node_id, target_node_id)
VALUES
    (1, 'edge-1-1', 'node-1-1', 'node-1-2'),
    (1, 'edge-1-2', 'node-1-2', 'node-1-3'),
    (1, 'edge-1-3', 'node-1-3', 'node-1-4')
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- TaskFlow for Project 2 (Hyundai Motors - Fan-out Pattern)
-- Pattern: One task fans out to multiple parallel tasks
-- ============================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

-- Nodes for Project 2 (Fan-out: Planning → [Frontend, Backend, Database] → Integration)
INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y)
VALUES
    (2, 'node-2-1', '기획', 'Admin', CURRENT_DATE - INTERVAL '10 days', 100, 100, 200),
    (2, 'node-2-2a', '프레임 제작', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 50),
    (2, 'node-2-2b', '전장 작업', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 200),
    (2, 'node-2-2c', '유압 시스템', '외주업체', CURRENT_DATE + INTERVAL '7 days', 75, 400, 350),
    (2, 'node-2-3', '조립 및 통합', '생산팀', CURRENT_DATE + INTERVAL '14 days', 0, 700, 200)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 2 (Fan-out then fan-in)
INSERT INTO task_edges (flow_id, edge_id, source_node_id, target_node_id)
VALUES
    (2, 'edge-2-1a', 'node-2-1', 'node-2-2a'),
    (2, 'edge-2-1b', 'node-2-1', 'node-2-2b'),
    (2, 'edge-2-1c', 'node-2-1', 'node-2-2c'),
    (2, 'edge-2-2a', 'node-2-2a', 'node-2-3'),
    (2, 'edge-2-2b', 'node-2-2b', 'node-2-3'),
    (2, 'edge-2-2c', 'node-2-2c', 'node-2-3')
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- TaskFlow for Project 3 (LG Display - Complex DAG)
-- Pattern: Complex interconnections with multiple dependencies
-- ============================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (3, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

-- Nodes for Project 3 (Complex DAG with various patterns)
INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y)
VALUES
    -- Row 1: Starting nodes
    (3, 'node-3-1', '도면 설계', '김설계', CURRENT_DATE - INTERVAL '7 days', 100, 100, 100),
    (3, 'node-3-2', '자재 발주', '구매팀', CURRENT_DATE - INTERVAL '3 days', 100, 100, 300),

    -- Row 2: Parallel manufacturing
    (3, 'node-3-3', '레이저 가공', '생산팀', CURRENT_DATE, 80, 350, 50),
    (3, 'node-3-4', '기계 가공', '생산팀', CURRENT_DATE + INTERVAL '2 days', 60, 350, 200),
    (3, 'node-3-5', '외주 도장', '외주업체', CURRENT_DATE - INTERVAL '2 days', 40, 350, 350), -- OVERDUE!

    -- Row 3: Assembly stages
    (3, 'node-3-6', '용접 조립', '생산팀', CURRENT_DATE + INTERVAL '5 days', 20, 600, 100),
    (3, 'node-3-7', '전장 조립', '생산팀', CURRENT_DATE + INTERVAL '7 days', 0, 600, 300),

    -- Row 4: Final stages
    (3, 'node-3-8', '최종 검사', '품질팀', CURRENT_DATE + INTERVAL '10 days', 0, 850, 150),
    (3, 'node-3-9', '포장 출하', '물류팀', CURRENT_DATE + INTERVAL '14 days', 0, 850, 300)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 3 (Complex dependencies)
INSERT INTO task_edges (flow_id, edge_id, source_node_id, target_node_id)
VALUES
    -- From design to manufacturing
    (3, 'edge-3-1', 'node-3-1', 'node-3-3'),
    (3, 'edge-3-2', 'node-3-1', 'node-3-4'),

    -- From materials to manufacturing
    (3, 'edge-3-3', 'node-3-2', 'node-3-3'),
    (3, 'edge-3-4', 'node-3-2', 'node-3-5'),

    -- From manufacturing to assembly
    (3, 'edge-3-5', 'node-3-3', 'node-3-6'),
    (3, 'edge-3-6', 'node-3-4', 'node-3-6'),
    (3, 'edge-3-7', 'node-3-5', 'node-3-7'),

    -- From assembly to inspection
    (3, 'edge-3-8', 'node-3-6', 'node-3-8'),
    (3, 'edge-3-9', 'node-3-7', 'node-3-8'),

    -- From inspection to shipping
    (3, 'edge-3-10', 'node-3-8', 'node-3-9')
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- Reset sequences
-- ============================================================================

SELECT setval('task_flows_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_flows));

-- ============================================================================
-- Summary
-- ============================================================================
-- Project 1 (Samsung): Linear flow - 4 nodes, 3 edges
-- Project 2 (Hyundai): Fan-out pattern - 5 nodes, 6 edges
-- Project 3 (LG Display): Complex DAG - 9 nodes, 10 edges
-- Total: 18 nodes, 19 edges across 3 projects
