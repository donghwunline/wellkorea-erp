package com.wellkorea.backend.purchasing.infrastructure.mapper;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.purchasing.api.dto.query.RfqItemView;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for purchase request queries.
 */
@Mapper
public interface PurchaseRequestMapper {

    @Select("""
            SELECT pr.id, pr.request_number as requestNumber, pr.project_id as projectId,
                   p.job_code as jobCode, pr.service_category_id as serviceCategoryId,
                   sc.name as serviceCategoryName, pr.description, pr.quantity, pr.uom,
                   pr.required_date as requiredDate, pr.status, u.full_name as createdByName,
                   pr.created_at as createdAt
            FROM purchase_requests pr
            LEFT JOIN projects p ON pr.project_id = p.id
            JOIN service_categories sc ON pr.service_category_id = sc.id
            JOIN users u ON pr.created_by_id = u.id
            ORDER BY pr.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseRequestSummaryView> findAll(@Param("size") int size, @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_requests
            """)
    long countAll();

    @Select("""
            SELECT pr.id, pr.request_number as requestNumber, pr.project_id as projectId,
                   p.job_code as jobCode, pr.service_category_id as serviceCategoryId,
                   sc.name as serviceCategoryName, pr.description, pr.quantity, pr.uom,
                   pr.required_date as requiredDate, pr.status, u.full_name as createdByName,
                   pr.created_at as createdAt
            FROM purchase_requests pr
            LEFT JOIN projects p ON pr.project_id = p.id
            JOIN service_categories sc ON pr.service_category_id = sc.id
            JOIN users u ON pr.created_by_id = u.id
            WHERE pr.project_id = #{projectId}
            ORDER BY pr.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseRequestSummaryView> findByProjectId(@Param("projectId") Long projectId,
                                                      @Param("size") int size,
                                                      @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_requests WHERE project_id = #{projectId}
            """)
    long countByProjectId(@Param("projectId") Long projectId);

    @Select("""
            SELECT pr.id, pr.request_number as requestNumber, pr.project_id as projectId,
                   p.job_code as jobCode, pr.service_category_id as serviceCategoryId,
                   sc.name as serviceCategoryName, pr.description, pr.quantity, pr.uom,
                   pr.required_date as requiredDate, pr.status, u.full_name as createdByName,
                   pr.created_at as createdAt
            FROM purchase_requests pr
            LEFT JOIN projects p ON pr.project_id = p.id
            JOIN service_categories sc ON pr.service_category_id = sc.id
            JOIN users u ON pr.created_by_id = u.id
            WHERE pr.status = #{status}
            ORDER BY pr.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseRequestSummaryView> findByStatus(@Param("status") String status,
                                                   @Param("size") int size,
                                                   @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_requests WHERE status = #{status}
            """)
    long countByStatus(@Param("status") String status);

    @Select("""
            SELECT pr.id, pr.request_number as requestNumber, pr.project_id as projectId,
                   p.job_code as jobCode, p.project_name as projectName,
                   pr.service_category_id as serviceCategoryId, sc.name as serviceCategoryName,
                   pr.description, pr.quantity, pr.uom, pr.required_date as requiredDate,
                   pr.status, pr.created_by_id as createdById, u.full_name as createdByName,
                   pr.created_at as createdAt, pr.updated_at as updatedAt
            FROM purchase_requests pr
            LEFT JOIN projects p ON pr.project_id = p.id
            JOIN service_categories sc ON pr.service_category_id = sc.id
            JOIN users u ON pr.created_by_id = u.id
            WHERE pr.id = #{id}
            """)
    @Results(id = "purchaseRequestDetailResult", value = {
            @Result(property = "id", column = "id"),
            @Result(property = "rfqItems", column = "id",
                    javaType = List.class,
                    many = @Many(select = "findRfqItemsByPurchaseRequestId"))
    })
    Optional<PurchaseRequestDetailView> findDetailById(@Param("id") Long id);

    @Select("""
            SELECT ri.id, ri.purchase_request_id as purchaseRequestId,
                   ri.vendor_company_id as vendorId, c.name as vendorName,
                   ri.vendor_offering_id as vendorOfferingId, ri.status,
                   ri.quoted_price as quotedPrice, ri.quoted_lead_time as quotedLeadTime,
                   ri.notes, ri.sent_at as sentAt, ri.replied_at as repliedAt,
                   ri.created_at as createdAt
            FROM rfq_items ri
            JOIN companies c ON ri.vendor_company_id = c.id
            WHERE ri.purchase_request_id = #{purchaseRequestId}
            ORDER BY ri.created_at
            """)
    List<RfqItemView> findRfqItemsByPurchaseRequestId(@Param("purchaseRequestId") Long purchaseRequestId);
}
