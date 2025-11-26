package com.wellkorea.erp.application.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;

import java.sql.SQLException;

/**
 * Error handler for database constraints and transaction failures
 */
@Component
public class ErrorHandler {

    private static final Logger logger = LoggerFactory.getLogger(ErrorHandler.class);

    /**
     * Handle data integrity violations with user-friendly messages
     */
    public String handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        logger.error("Data integrity violation", ex);

        String message = ex.getMessage();
        if (message == null) {
            return "Data integrity violation occurred";
        }

        // Check for specific constraint violations
        if (message.contains("unique constraint") || message.contains("duplicate key")) {
            if (message.contains("jobcode")) {
                return "JobCode already exists. JobCode must be unique.";
            } else if (message.contains("email")) {
                return "Email address is already in use";
            } else if (message.contains("username")) {
                return "Username is already taken";
            } else if (message.contains("quotation_number")) {
                return "Quotation number already exists";
            }
            return "A record with this value already exists";
        }

        if (message.contains("foreign key constraint")) {
            if (message.contains("customer_id")) {
                return "Customer does not exist";
            } else if (message.contains("product_id")) {
                return "Product does not exist";
            } else if (message.contains("jobcode_id")) {
                return "JobCode does not exist";
            } else if (message.contains("DELETE")) {
                return "Cannot delete this record as it is referenced by other records";
            }
            return "Referenced record does not exist";
        }

        if (message.contains("not null constraint") || message.contains("null value")) {
            return "Required field is missing";
        }

        if (message.contains("check constraint")) {
            if (message.contains("quantity")) {
                return "Quantity must be greater than zero";
            } else if (message.contains("price")) {
                return "Price must be a valid positive number";
            } else if (message.contains("status")) {
                return "Invalid status value";
            }
            return "Value does not meet validation requirements";
        }

        return "Data integrity violation. Please check your input.";
    }

    /**
     * Handle transaction failures
     */
    public String handleTransactionFailure(TransactionException ex) {
        logger.error("Transaction failure", ex);

        if (ex instanceof OptimisticLockingFailureException) {
            return "The record was modified by another user. Please refresh and try again.";
        }

        return "Transaction failed. Please try again.";
    }

    /**
     * Handle SQL exceptions
     */
    public String handleSQLException(SQLException ex) {
        logger.error("SQL exception", ex);

        String sqlState = ex.getSQLState();
        if (sqlState != null) {
            // PostgreSQL error codes
            if (sqlState.startsWith("23")) { // Integrity constraint violation
                return handleDataIntegrityViolation(
                        new DataIntegrityViolationException(ex.getMessage(), ex));
            } else if (sqlState.startsWith("40")) { // Transaction rollback
                return "Transaction was rolled back. Please try again.";
            } else if (sqlState.startsWith("42")) { // Syntax error or access violation
                return "Database query error. Please contact support.";
            }
        }

        return "Database error occurred. Please try again later.";
    }

    /**
     * Check if exception is a duplicate key violation
     */
    public boolean isDuplicateKeyViolation(Exception ex) {
        if (ex instanceof DataIntegrityViolationException) {
            String message = ex.getMessage();
            return message != null && (message.contains("unique constraint") ||
                    message.contains("duplicate key"));
        }
        return false;
    }

    /**
     * Check if exception is a foreign key violation
     */
    public boolean isForeignKeyViolation(Exception ex) {
        if (ex instanceof DataIntegrityViolationException) {
            String message = ex.getMessage();
            return message != null && message.contains("foreign key constraint");
        }
        return false;
    }

    /**
     * Extract constraint name from exception message
     */
    public String extractConstraintName(DataIntegrityViolationException ex) {
        String message = ex.getMessage();
        if (message == null) {
            return null;
        }

        // Try to extract constraint name from error message
        // Format: ... constraint "constraint_name" ...
        int start = message.indexOf("constraint \"");
        if (start != -1) {
            start += 12; // length of 'constraint "'
            int end = message.indexOf("\"", start);
            if (end != -1) {
                return message.substring(start, end);
            }
        }

        return null;
    }
}
