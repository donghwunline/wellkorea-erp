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
INSERT INTO task_nodes (id, flow_id, node_id, title, description, assignee, deadline, progress, position_x, position_y, created_at, updated_at)
VALUES
    (1, 1, 'node-1-1', '설계', '제품 설계 및 도면 작성', '김설계', CURRENT_DATE - INTERVAL '5 days', 100, 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 1, 'node-1-2', '개발', '제품 개발 및 프로토타입', '박개발', CURRENT_DATE + INTERVAL '3 days', 75, 350, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 1, 'node-1-3', '테스트', '품질 검사 및 테스트', '이품질', CURRENT_DATE + INTERVAL '10 days', 25, 600, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 1, 'node-1-4', '출하', '포장 및 출하 준비', '최출하', CURRENT_DATE + INTERVAL '15 days', 0, 850, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 1 (Linear chain)
INSERT INTO task_edges (id, flow_id, edge_id, source_node_id, target_node_id, created_at)
VALUES
    (1, 1, 'edge-1-1', 'node-1-1', 'node-1-2', CURRENT_TIMESTAMP),
    (2, 1, 'edge-1-2', 'node-1-2', 'node-1-3', CURRENT_TIMESTAMP),
    (3, 1, 'edge-1-3', 'node-1-3', 'node-1-4', CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- TaskFlow for Project 2 (Hyundai Motors - Fan-out Pattern)
-- Pattern: One task fans out to multiple parallel tasks
-- ============================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

-- Nodes for Project 2 (Fan-out: Planning → [Frontend, Backend, Database] → Integration)
INSERT INTO task_nodes (id, flow_id, node_id, title, description, assignee, deadline, progress, position_x, position_y, created_at, updated_at)
VALUES
    (5, 2, 'node-2-1', '기획', '프로젝트 기획 및 요구사항 분석', 'Admin', CURRENT_DATE - INTERVAL '10 days', 100, 100, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (6, 2, 'node-2-2a', '프레임 제작', '장비 프레임 제작', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (7, 2, 'node-2-2b', '전장 작업', '전기 배선 및 컨트롤러', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (8, 2, 'node-2-2c', '유압 시스템', '유압 시스템 설치', '외주업체', CURRENT_DATE + INTERVAL '7 days', 75, 400, 350, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (9, 2, 'node-2-3', '조립 및 통합', '최종 조립 및 시스템 통합', '생산팀', CURRENT_DATE + INTERVAL '14 days', 0, 700, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 2 (Fan-out then fan-in)
INSERT INTO task_edges (id, flow_id, edge_id, source_node_id, target_node_id, created_at)
VALUES
    (4, 2, 'edge-2-1a', 'node-2-1', 'node-2-2a', CURRENT_TIMESTAMP),
    (5, 2, 'edge-2-1b', 'node-2-1', 'node-2-2b', CURRENT_TIMESTAMP),
    (6, 2, 'edge-2-1c', 'node-2-1', 'node-2-2c', CURRENT_TIMESTAMP),
    (7, 2, 'edge-2-2a', 'node-2-2a', 'node-2-3', CURRENT_TIMESTAMP),
    (8, 2, 'edge-2-2b', 'node-2-2b', 'node-2-3', CURRENT_TIMESTAMP),
    (9, 2, 'edge-2-2c', 'node-2-2c', 'node-2-3', CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- TaskFlow for Project 3 (LG Display - Complex DAG)
-- Pattern: Complex interconnections with multiple dependencies
-- ============================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (3, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

-- Nodes for Project 3 (Complex DAG with various patterns)
INSERT INTO task_nodes (id, flow_id, node_id, title, description, assignee, deadline, progress, position_x, position_y, created_at, updated_at)
VALUES
    -- Row 1: Starting nodes
    (10, 3, 'node-3-1', '도면 설계', '클린룸 장비 도면 설계', '김설계', CURRENT_DATE - INTERVAL '7 days', 100, 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 3, 'node-3-2', '자재 발주', '필요 자재 발주 및 입고', '구매팀', CURRENT_DATE - INTERVAL '3 days', 100, 100, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Row 2: Parallel manufacturing
    (12, 3, 'node-3-3', '레이저 가공', '판금 레이저 커팅', '생산팀', CURRENT_DATE, 80, 350, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (13, 3, 'node-3-4', '기계 가공', 'CNC 기계 가공', '생산팀', CURRENT_DATE + INTERVAL '2 days', 60, 350, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (14, 3, 'node-3-5', '외주 도장', '분체 도장 외주', '외주업체', CURRENT_DATE - INTERVAL '2 days', 40, 350, 350, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- OVERDUE!

    -- Row 3: Assembly stages
    (15, 3, 'node-3-6', '용접 조립', '프레임 용접 및 조립', '생산팀', CURRENT_DATE + INTERVAL '5 days', 20, 600, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (16, 3, 'node-3-7', '전장 조립', '전기 배선 조립', '생산팀', CURRENT_DATE + INTERVAL '7 days', 0, 600, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Row 4: Final stages
    (17, 3, 'node-3-8', '최종 검사', '품질 검사 및 테스트', '품질팀', CURRENT_DATE + INTERVAL '10 days', 0, 850, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (18, 3, 'node-3-9', '포장 출하', '포장 및 출하', '물류팀', CURRENT_DATE + INTERVAL '14 days', 0, 850, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, node_id) DO NOTHING;

-- Edges for Project 3 (Complex dependencies)
INSERT INTO task_edges (id, flow_id, edge_id, source_node_id, target_node_id, created_at)
VALUES
    -- From design to manufacturing
    (10, 3, 'edge-3-1', 'node-3-1', 'node-3-3', CURRENT_TIMESTAMP),
    (11, 3, 'edge-3-2', 'node-3-1', 'node-3-4', CURRENT_TIMESTAMP),

    -- From materials to manufacturing
    (12, 3, 'edge-3-3', 'node-3-2', 'node-3-3', CURRENT_TIMESTAMP),
    (13, 3, 'edge-3-4', 'node-3-2', 'node-3-5', CURRENT_TIMESTAMP),

    -- From manufacturing to assembly
    (14, 3, 'edge-3-5', 'node-3-3', 'node-3-6', CURRENT_TIMESTAMP),
    (15, 3, 'edge-3-6', 'node-3-4', 'node-3-6', CURRENT_TIMESTAMP),
    (16, 3, 'edge-3-7', 'node-3-5', 'node-3-7', CURRENT_TIMESTAMP),

    -- From assembly to inspection
    (17, 3, 'edge-3-8', 'node-3-6', 'node-3-8', CURRENT_TIMESTAMP),
    (18, 3, 'edge-3-9', 'node-3-7', 'node-3-8', CURRENT_TIMESTAMP),

    -- From inspection to shipping
    (19, 3, 'edge-3-10', 'node-3-8', 'node-3-9', CURRENT_TIMESTAMP)
ON CONFLICT (flow_id, edge_id) DO NOTHING;

-- ============================================================================
-- Reset sequences
-- ============================================================================

SELECT setval('task_flows_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_flows));
SELECT setval('task_nodes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_nodes));
SELECT setval('task_edges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_edges));

-- ============================================================================
-- Summary
-- ============================================================================
-- Project 1 (Samsung): Linear flow - 4 nodes, 3 edges
-- Project 2 (Hyundai): Fan-out pattern - 5 nodes, 6 edges
-- Project 3 (LG Display): Complex DAG - 9 nodes, 10 edges
-- Total: 18 nodes, 19 edges across 3 projects
