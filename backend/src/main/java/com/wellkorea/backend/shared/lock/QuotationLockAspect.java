package com.wellkorea.backend.shared.lock;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect that handles distributed locking for methods annotated with {@link QuotationLock}.
 * <p>
 * This aspect intercepts method calls and wraps them with a distributed lock acquisition/release,
 * completely separating locking infrastructure concerns from business logic.
 * <p>
 * The aspect extracts the quotation ID from the method parameter specified in
 * {@link QuotationLock#quotationIdParam()} and uses {@link QuotationLockService} to acquire
 * an exclusive lock before proceeding with the method execution.
 *
 * <h2>Execution Order</h2>
 * This aspect runs with {@code @Order(0)} to ensure it executes before transaction aspects
 * (which typically run at the default order). This ensures:
 * <ol>
 *   <li>Lock is acquired BEFORE transaction starts</li>
 *   <li>Method executes within transaction</li>
 *   <li>Transaction commits</li>
 *   <li>Lock is released AFTER transaction completes</li>
 * </ol>
 *
 * @see QuotationLock
 * @see QuotationLockService
 */
@Aspect
@Component
@Order(0) // Execute before @Transactional (ensures lock acquired before transaction starts)
public class QuotationLockAspect {

    private static final Logger log = LoggerFactory.getLogger(QuotationLockAspect.class);

    private final QuotationLockService quotationLockService;

    public QuotationLockAspect(QuotationLockService quotationLockService) {
        this.quotationLockService = quotationLockService;
    }

    /**
     * Intercepts methods annotated with {@link QuotationLock} and wraps them with distributed locking.
     *
     * @param joinPoint     The method join point
     * @param quotationLock The annotation instance
     * @return The method return value
     * @throws Throwable If the method throws an exception
     */
    @Around("@annotation(quotationLock)")
    public Object aroundQuotationLock(ProceedingJoinPoint joinPoint, QuotationLock quotationLock) throws Throwable {
        Long quotationId = extractQuotationId(joinPoint, quotationLock.quotationIdParam());

        log.debug("Acquiring quotation lock for method {} with quotationId={}",
                joinPoint.getSignature().getName(), quotationId);

        return quotationLockService.executeWithLock(quotationId, () -> {
            try {
                return joinPoint.proceed();
            } catch (RuntimeException | Error e) {
                throw e;
            } catch (Throwable e) {
                // Wrap checked exceptions in RuntimeException
                throw new RuntimeException("Unexpected checked exception in locked method", e);
            }
        });
    }

    /**
     * Extract the quotation ID from method parameters based on the parameter name.
     */
    private Long extractQuotationId(ProceedingJoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < paramNames.length; i++) {
            if (paramNames[i].equals(paramName)) {
                Object value = args[i];
                if (value == null) {
                    throw new IllegalArgumentException(
                            "Quotation ID parameter '" + paramName + "' is null in method " +
                                    signature.getDeclaringTypeName() + "." + signature.getName());
                }
                if (value instanceof Long) {
                    return (Long) value;
                }
                throw new IllegalArgumentException(
                        "Quotation ID parameter '" + paramName + "' must be of type Long, but was " +
                                value.getClass().getSimpleName() + " in method " +
                                signature.getDeclaringTypeName() + "." + signature.getName());
            }
        }

        throw new IllegalArgumentException(
                "No parameter named '" + paramName + "' found in method " +
                        signature.getDeclaringTypeName() + "." + signature.getName() +
                        ". Available parameters: " + String.join(", ", paramNames));
    }
}
