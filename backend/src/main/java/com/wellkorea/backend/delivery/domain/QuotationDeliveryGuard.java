package com.wellkorea.backend.delivery.domain;

import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.shared.exception.BusinessException;

import java.util.List;

/**
 * Domain interface for validating delivery line items against a quotation.
 * <p>
 * This interface follows the Double Dispatch pattern - it's defined in the domain layer
 * but implemented in the infrastructure layer where it has access to repositories.
 * <p>
 * The Quotation entity receives this guard as a parameter to its factory method,
 * allowing the domain to delegate validation while maintaining a rich domain model.
 * <p>
 * Validations performed:
 * <ul>
 *   <li>All products must exist in the quotation</li>
 *   <li>Quantities must be positive</li>
 *   <li>Delivery quantities must not exceed remaining deliverable amounts</li>
 *   <li>No duplicate products in delivery request</li>
 * </ul>
 * <p>
 * Similar pattern: {@link com.wellkorea.backend.project.domain.JobCodeSequenceProvider}
 *
 * @see com.wellkorea.backend.delivery.infrastructure.validation.DatabaseQuotationDeliveryGuard
 */
public interface QuotationDeliveryGuard {

    /**
     * Validate that the delivery line items can be delivered against the quotation.
     *
     * @param quotation Quotation to validate against (must be approved)
     * @param lineItems Line items to validate
     * @throws BusinessException if any validation fails
     */
    void validateAndThrow(Quotation quotation, List<DeliveryLineItemInput> lineItems);

    /**
     * Validate that the delivery line items can be delivered against the quotation,
     * excluding a specific delivery from the "already delivered" calculation.
     * <p>
     * Used for reassignment scenarios where an existing delivery is being moved
     * to a different quotation - we need to exclude that delivery's quantities
     * from the calculation to avoid double-counting.
     *
     * @param quotation         Quotation to validate against (must be approved)
     * @param lineItems         Line items to validate
     * @param excludeDeliveryId Delivery ID to exclude from existing delivery calculation
     * @throws BusinessException if any validation fails
     */
    void validateAndThrow(Quotation quotation, List<DeliveryLineItemInput> lineItems, Long excludeDeliveryId);
}
