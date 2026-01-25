package com.wellkorea.backend.approval.infrastructure.mapper;

import com.wellkorea.backend.approval.api.dto.query.ApprovalDetailView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalHistoryView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalSummaryView;
import com.wellkorea.backend.approval.api.dto.query.ChainTemplateView;
import com.wellkorea.backend.approval.domain.vo.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for approval queries.
 * Handles all read operations for approvals with optimized JOINs.
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs and nested result mapping.
 */
@Mapper
public interface ApprovalMapper {

    /**
     * Find approval detail by ID with all level decisions.
     * Returns full detail view including level decisions with user names resolved.
     *
     * @param id The approval request ID
     * @return ApprovalDetailView with nested level decisions
     */
    Optional<ApprovalDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find all approvals with filters.
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

    /**
     * Find approval history for a request.
     *
     * @param approvalRequestId The approval request ID
     * @return List of ApprovalHistoryView with actor names resolved
     */
    List<ApprovalHistoryView> findHistoryByRequestId(@Param("approvalRequestId") Long approvalRequestId);

    /**
     * Find all chain templates.
     *
     * @return List of ChainTemplateView with nested levels
     */
    List<ChainTemplateView> findAllChainTemplates();

    /**
     * Find chain template by ID.
     *
     * @param id The chain template ID
     * @return ChainTemplateView with nested levels
     */
    Optional<ChainTemplateView> findChainTemplateById(@Param("id") Long id);

    /**
     * Check if approval request exists.
     */
    boolean existsById(@Param("id") Long id);
}
