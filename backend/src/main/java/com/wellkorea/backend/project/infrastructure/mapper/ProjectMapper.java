package com.wellkorea.backend.project.infrastructure.mapper;

import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.ProjectStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for project queries.
 * Eliminates N+1 queries by using explicit JOINs for related entities.
 */
@Mapper
public interface ProjectMapper {

    /**
     * Find project detail by ID with all related names resolved.
     */
    Optional<ProjectDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find project detail by JobCode with all related names resolved.
     */
    Optional<ProjectDetailView> findDetailByJobCode(@Param("jobCode") String jobCode);

    /**
     * Find projects with filters for pagination.
     */
    List<ProjectSummaryView> findWithFilters(
            @Param("status") ProjectStatus status,
            @Param("customerIds") List<Long> customerIds,
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count projects with filters for pagination.
     */
    long countWithFilters(
            @Param("status") ProjectStatus status,
            @Param("customerIds") List<Long> customerIds,
            @Param("search") String search);
}
