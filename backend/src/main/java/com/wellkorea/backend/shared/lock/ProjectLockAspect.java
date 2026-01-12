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
 * AOP Aspect that handles distributed locking for methods annotated with {@link ProjectLock}.
 * <p>
 * This aspect intercepts method calls and wraps them with a distributed lock acquisition/release,
 * completely separating locking infrastructure concerns from business logic.
 * <p>
 * The aspect extracts the project ID from the method parameter specified in
 * {@link ProjectLock#projectIdParam()} and uses {@link ProjectLockService} to acquire
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
 * @see ProjectLock
 * @see ProjectLockService
 */
@Aspect
@Component
@Order(0) // Execute before @Transactional (ensures lock acquired before transaction starts)
public class ProjectLockAspect {

    private static final Logger log = LoggerFactory.getLogger(ProjectLockAspect.class);

    private final ProjectLockService projectLockService;

    public ProjectLockAspect(ProjectLockService projectLockService) {
        this.projectLockService = projectLockService;
    }

    /**
     * Intercepts methods annotated with {@link ProjectLock} and wraps them with distributed locking.
     *
     * @param joinPoint The method join point
     * @param projectLock The annotation instance
     * @return The method return value
     * @throws Throwable If the method throws an exception
     */
    @Around("@annotation(projectLock)")
    public Object aroundProjectLock(ProceedingJoinPoint joinPoint, ProjectLock projectLock) throws Throwable {
        Long projectId = extractProjectId(joinPoint, projectLock.projectIdParam());

        log.debug("Acquiring project lock for method {} with projectId={}",
                joinPoint.getSignature().getName(), projectId);

        return projectLockService.executeWithLock(projectId, () -> {
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
     * Extract the project ID from method parameters based on the parameter name.
     */
    private Long extractProjectId(ProceedingJoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < paramNames.length; i++) {
            if (paramNames[i].equals(paramName)) {
                Object value = args[i];
                if (value == null) {
                    throw new IllegalArgumentException(
                            "Project ID parameter '" + paramName + "' is null in method " +
                                    signature.getDeclaringTypeName() + "." + signature.getName());
                }
                if (value instanceof Long) {
                    return (Long) value;
                }
                throw new IllegalArgumentException(
                        "Project ID parameter '" + paramName + "' must be of type Long, but was " +
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
