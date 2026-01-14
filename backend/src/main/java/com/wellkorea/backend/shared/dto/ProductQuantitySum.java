package com.wellkorea.backend.shared.dto;

import java.math.BigDecimal;

/**
 * DTO for product quantity aggregation results.
 * Used by mappers to return typed results instead of Object[] arrays.
 * <p>
 * Replaces the need for manual type conversion from JPA SUM results.
 */
public record ProductQuantitySum(
        Long productId,
        BigDecimal quantity
) {
}
