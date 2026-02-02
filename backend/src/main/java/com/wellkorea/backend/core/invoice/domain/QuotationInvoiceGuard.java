package com.wellkorea.backend.core.invoice.domain;

import com.wellkorea.backend.core.delivery.domain.QuotationDeliveryGuard;
import com.wellkorea.backend.core.invoice.infrastructure.validation.DatabaseQuotationInvoiceGuard;
import com.wellkorea.backend.core.quotation.domain.Quotation;
import com.wellkorea.backend.shared.exception.BusinessException;

import java.util.List;

/**
 * Domain interface for validating invoice line items against a quotation.
 * <p>
 * This interface follows the Double Dispatch pattern - it's defined in the domain layer
 * but implemented in the infrastructure layer where it has access to repositories.
 * <p>
 * Validations performed:
 * <ul>
 *   <li>All products must exist in the quotation</li>
 *   <li>Quantities must be positive</li>
 *   <li>Invoice quantities must not exceed remaining invoiceable amounts (delivered - already invoiced)</li>
 *   <li>No duplicate products in invoice request</li>
 * </ul>
 * <p>
 * Similar pattern: {@link QuotationDeliveryGuard}
 *
 * @see DatabaseQuotationInvoiceGuard
 */
public interface QuotationInvoiceGuard {

    /**
     * Validate that the invoice line items can be invoiced against the quotation.
     *
     * @param quotation Quotation to validate against (must be approved)
     * @param lineItems Line items to validate
     * @throws BusinessException if any validation fails
     */
    void validateAndThrow(Quotation quotation, List<InvoiceLineItemInput> lineItems);
}
