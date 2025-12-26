package com.wellkorea.backend.quotation.infrastructure.mapper;

import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

/**
 * MyBatis mapper for complex quotation queries.
 * Used alongside JPA repository (JPA handles commands, MyBatis handles complex reads).
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs and nested result mapping.
 */
@Mapper
public interface QuotationMapper {

    /**
     * Find quotation detail by ID with all related data in a single query.
     * Replaces JPA findByIdWithLineItems() which had N+1 issue on Product entity.
     *
     * @param id The quotation ID
     * @return QuotationDetailView with all nested data (project, createdBy, lineItems with products)
     */
    Optional<QuotationDetailView> findDetailById(@Param("id") Long id);
}
