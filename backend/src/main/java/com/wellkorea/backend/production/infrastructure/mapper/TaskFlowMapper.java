package com.wellkorea.backend.production.infrastructure.mapper;

import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

/**
 * MyBatis mapper for task flow queries.
 * Handles all read operations for task flows with optimized JOINs.
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs and nested result mapping
 * for nodes and edges collections.
 */
@Mapper
public interface TaskFlowMapper {

    /**
     * Find task flow by project ID with all nodes and edges.
     *
     * @param projectId The project ID
     * @return TaskFlowView with nested nodes and edges
     */
    Optional<TaskFlowView> findByProjectId(@Param("projectId") Long projectId);

    /**
     * Find task flow by ID with all nodes and edges.
     *
     * @param id The task flow ID
     * @return TaskFlowView with nested nodes and edges
     */
    Optional<TaskFlowView> findById(@Param("id") Long id);
}
