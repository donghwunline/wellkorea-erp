package com.wellkorea.erp.application.jobcode;

import com.wellkorea.erp.api.common.exception.BadRequestException;
import com.wellkorea.erp.api.common.exception.ResourceNotFoundException;
import com.wellkorea.erp.api.jobcode.dto.CreateJobCodeRequest;
import com.wellkorea.erp.api.jobcode.dto.UpdateJobCodeRequest;
import com.wellkorea.erp.domain.customer.Customer;
import com.wellkorea.erp.domain.customer.CustomerRepository;
import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.jobcode.JobCodeGenerator;
import com.wellkorea.erp.domain.jobcode.JobCodeRepository;
import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import com.wellkorea.erp.domain.user.User;
import com.wellkorea.erp.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobCodeService {

    private final JobCodeRepository jobCodeRepository;
    private final JobCodeGenerator jobCodeGenerator;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Transactional
    public JobCode createJobCode(CreateJobCodeRequest request) {
        log.info("Creating JobCode for project: {}", request.getProjectName());

        // Validate due date
        if (request.getDueDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Due date must be today or in the future");
        }

        // Validate customer exists
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

        // Validate owner exists
        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getOwnerId()));

        // Generate unique JobCode
        String code = jobCodeGenerator.generateJobCode();

        // Create JobCode entity
        JobCode jobCode = new JobCode();
        jobCode.setJobcode(code);
        jobCode.setProjectName(request.getProjectName());
        jobCode.setCustomer(customer);
        jobCode.setInternalOwner(owner);
        jobCode.setRequestedDueDate(request.getDueDate());
        jobCode.setDescription(request.getDescription());
        jobCode.setStatus(JobCodeStatus.DRAFT);

        JobCode savedJobCode = jobCodeRepository.save(jobCode);
        log.info("JobCode created successfully: {}", savedJobCode.getJobcode());

        return savedJobCode;
    }

    @Transactional(readOnly = true)
    public Optional<JobCode> getJobCodeById(UUID id) {
        log.debug("Fetching JobCode by ID: {}", id);
        return jobCodeRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public JobCode getJobCodeByIdOrThrow(UUID id) {
        return getJobCodeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobCode not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public Optional<JobCode> getJobCodeByCode(String code) {
        log.debug("Fetching JobCode by code: {}", code);
        return jobCodeRepository.findByJobcode(code);
    }

    @Transactional(readOnly = true)
    public Page<JobCode> listJobCodes(JobCodeStatus status, UUID customerId, Pageable pageable) {
        log.debug("Listing JobCodes with status: {}, customerId: {}, page: {}", status, customerId, pageable.getPageNumber());

        if (status != null && customerId != null) {
            return jobCodeRepository.findByStatusAndCustomerId(status, customerId, pageable);
        } else if (status != null) {
            return jobCodeRepository.findByStatus(status, pageable);
        } else if (customerId != null) {
            return jobCodeRepository.findByCustomerId(customerId, pageable);
        } else {
            return jobCodeRepository.findAll(pageable);
        }
    }

    @Transactional
    public JobCode updateJobCode(UUID id, UpdateJobCodeRequest request) {
        log.info("Updating JobCode with ID: {}", id);

        JobCode jobCode = getJobCodeByIdOrThrow(id);

        // Update fields if provided
        if (request.getProjectName() != null) {
            jobCode.setProjectName(request.getProjectName());
        }

        if (request.getDescription() != null) {
            jobCode.setDescription(request.getDescription());
        }

        if (request.getDueDate() != null) {
            if (request.getDueDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Due date must be today or in the future");
            }
            jobCode.setRequestedDueDate(request.getDueDate());
        }

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));
            jobCode.setCustomer(customer);
        }

        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getOwnerId()));
            jobCode.setInternalOwner(owner);
        }

        if (request.getStatus() != null) {
            validateStatusTransition(jobCode.getStatus(), request.getStatus());
            jobCode.setStatus(request.getStatus());
        }

        JobCode updatedJobCode = jobCodeRepository.save(jobCode);
        log.info("JobCode updated successfully: {}", updatedJobCode.getJobcode());

        return updatedJobCode;
    }

    @Transactional
    public void deleteJobCode(UUID id) {
        log.info("Deleting JobCode with ID: {}", id);

        JobCode jobCode = getJobCodeByIdOrThrow(id);

        // Only allow deletion of DRAFT status
        if (jobCode.getStatus() != JobCodeStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT JobCodes can be deleted. Current status: " + jobCode.getStatus());
        }

        jobCodeRepository.delete(jobCode);
        log.info("JobCode deleted successfully: {}", jobCode.getJobcode());
    }

    private void validateStatusTransition(JobCodeStatus currentStatus, JobCodeStatus newStatus) {
        // Define valid status transitions
        boolean isValidTransition = switch (currentStatus) {
            case DRAFT -> newStatus == JobCodeStatus.ACTIVE || newStatus == JobCodeStatus.CANCELLED;
            case ACTIVE -> newStatus == JobCodeStatus.IN_PROGRESS || newStatus == JobCodeStatus.CANCELLED;
            case IN_PROGRESS -> newStatus == JobCodeStatus.COMPLETED || newStatus == JobCodeStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };

        if (!isValidTransition) {
            throw new BadRequestException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus)
            );
        }
    }
}
