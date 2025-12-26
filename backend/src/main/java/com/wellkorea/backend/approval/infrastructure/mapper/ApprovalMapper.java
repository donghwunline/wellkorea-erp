package com.wellkorea.backend.approval.infrastructure.mapper;

import com.wellkorea.backend.approval.api.dto.query.ApprovalSummaryView;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * MyBatis mapper for complex approval queries.
 * Used alongside JPA repository (JPA handles commands, MyBatis handles complex reads).
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs.
 */
@Mapper
public interface ApprovalMapper {

    /**
     * Find all approvals with filters.
     * Replaces JPA findAllWithFilters() which had N+1 issue on submittedBy user.
     *
     * @param entityType Optional filter by entity type
     * @param status     Optional filter by status
     * @param limit      Page size
     * @param offset     Page offset
     * @return List of ApprovalSummaryView with user names resolved
     */
    List<ApprovalSummaryView> findAllWithFilters(
            @Param("entityType") EntityType entityType,
            @Param("status") ApprovalStatus status,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count approvals with filters (for pagination).
     */
    long countWithFilters(
            @Param("entityType") EntityType entityType,
            @Param("status") ApprovalStatus status);

    /**
     * Find pending approvals for a specific approver.
     * Replaces JPA findPendingByApproverUserId() which had N+1 issue on submittedBy user.
     *
     * @param userId Approver's user ID
     * @param limit  Page size
     * @param offset Page offset
     * @return List of ApprovalSummaryView with user names resolved
     */
    List<ApprovalSummaryView> findPendingByApproverUserId(
            @Param("userId") Long userId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count pending approvals for a user (for pagination).
     */
    long countPendingByApproverUserId(@Param("userId") Long userId);
}
