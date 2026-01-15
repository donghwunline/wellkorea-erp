package com.wellkorea.backend.purchasing.infrastructure.mapper;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderSummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for purchase order queries.
 */
@Mapper
public interface PurchaseOrderMapper {

    @Select("""
            SELECT po.id, po.po_number as poNumber, po.rfq_item_id as rfqItemId,
                   po.project_id as projectId, p.job_code as jobCode,
                   po.vendor_company_id as vendorId, c.name as vendorName,
                   po.order_date as orderDate, po.expected_delivery_date as expectedDeliveryDate,
                   po.total_amount as totalAmount, po.currency, po.status,
                   u.full_name as createdByName, po.created_at as createdAt
            FROM purchase_orders po
            LEFT JOIN projects p ON po.project_id = p.id
            JOIN companies c ON po.vendor_company_id = c.id
            JOIN users u ON po.created_by_id = u.id
            ORDER BY po.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseOrderSummaryView> findAll(@Param("size") int size, @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_orders
            """)
    long countAll();

    @Select("""
            SELECT po.id, po.po_number as poNumber, po.rfq_item_id as rfqItemId,
                   po.project_id as projectId, p.job_code as jobCode,
                   po.vendor_company_id as vendorId, c.name as vendorName,
                   po.order_date as orderDate, po.expected_delivery_date as expectedDeliveryDate,
                   po.total_amount as totalAmount, po.currency, po.status,
                   u.full_name as createdByName, po.created_at as createdAt
            FROM purchase_orders po
            LEFT JOIN projects p ON po.project_id = p.id
            JOIN companies c ON po.vendor_company_id = c.id
            JOIN users u ON po.created_by_id = u.id
            WHERE po.vendor_company_id = #{vendorId}
            ORDER BY po.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseOrderSummaryView> findByVendorId(@Param("vendorId") Long vendorId,
                                                   @Param("size") int size,
                                                   @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_orders WHERE vendor_company_id = #{vendorId}
            """)
    long countByVendorId(@Param("vendorId") Long vendorId);

    @Select("""
            SELECT po.id, po.po_number as poNumber, po.rfq_item_id as rfqItemId,
                   po.project_id as projectId, p.job_code as jobCode,
                   po.vendor_company_id as vendorId, c.name as vendorName,
                   po.order_date as orderDate, po.expected_delivery_date as expectedDeliveryDate,
                   po.total_amount as totalAmount, po.currency, po.status,
                   u.full_name as createdByName, po.created_at as createdAt
            FROM purchase_orders po
            LEFT JOIN projects p ON po.project_id = p.id
            JOIN companies c ON po.vendor_company_id = c.id
            JOIN users u ON po.created_by_id = u.id
            WHERE po.status = #{status}
            ORDER BY po.created_at DESC
            LIMIT #{size} OFFSET #{offset}
            """)
    List<PurchaseOrderSummaryView> findByStatus(@Param("status") String status,
                                                 @Param("size") int size,
                                                 @Param("offset") int offset);

    @Select("""
            SELECT COUNT(*) FROM purchase_orders WHERE status = #{status}
            """)
    long countByStatus(@Param("status") String status);

    @Select("""
            SELECT po.id, po.po_number as poNumber, po.rfq_item_id as rfqItemId,
                   ri.purchase_request_id as purchaseRequestId, pr.request_number as purchaseRequestNumber,
                   po.project_id as projectId, p.job_code as jobCode, p.project_name as projectName,
                   po.vendor_company_id as vendorId, c.name as vendorName,
                   po.order_date as orderDate, po.expected_delivery_date as expectedDeliveryDate,
                   po.total_amount as totalAmount, po.currency, po.status, po.notes,
                   po.created_by_id as createdById, u.full_name as createdByName,
                   po.created_at as createdAt, po.updated_at as updatedAt
            FROM purchase_orders po
            JOIN rfq_items ri ON po.rfq_item_id = ri.id
            JOIN purchase_requests pr ON ri.purchase_request_id = pr.id
            LEFT JOIN projects p ON po.project_id = p.id
            JOIN companies c ON po.vendor_company_id = c.id
            JOIN users u ON po.created_by_id = u.id
            WHERE po.id = #{id}
            """)
    Optional<PurchaseOrderDetailView> findDetailById(@Param("id") Long id);
}
