package com.wellkorea.erp.api.jobcode;

import com.wellkorea.erp.api.common.ApiResponse;
import com.wellkorea.erp.api.common.PaginatedResponse;
import com.wellkorea.erp.api.jobcode.dto.CreateJobCodeRequest;
import com.wellkorea.erp.api.jobcode.dto.JobCodeResponse;
import com.wellkorea.erp.api.jobcode.dto.UpdateJobCodeRequest;
import com.wellkorea.erp.application.jobcode.JobCodeService;
import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobcodes")
@RequiredArgsConstructor
@Slf4j
public class JobCodeController {

    private final JobCodeService jobCodeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ApiResponse<JobCodeResponse> createJobCode(@Valid @RequestBody CreateJobCodeRequest request) {
        log.info("POST /api/v1/jobcodes - Creating JobCode for project: {}", request.getProjectName());

        JobCode jobCode = jobCodeService.createJobCode(request);
        JobCodeResponse response = JobCodeResponse.from(jobCode);

        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'FINANCE', 'PRODUCTION')")
    public ApiResponse<JobCodeResponse> getJobCodeById(@PathVariable UUID id) {
        log.info("GET /api/v1/jobcodes/{} - Fetching JobCode", id);

        JobCode jobCode = jobCodeService.getJobCodeByIdOrThrow(id);
        JobCodeResponse response = JobCodeResponse.from(jobCode);

        return ApiResponse.success(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'FINANCE', 'PRODUCTION')")
    public ApiResponse<PaginatedResponse<JobCodeResponse>> listJobCodes(
            @RequestParam(required = false) JobCodeStatus status,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection
    ) {
        log.info("GET /api/v1/jobcodes - Listing JobCodes with status: {}, customerId: {}, page: {}, size: {}",
                status, customerId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<JobCode> jobCodePage = jobCodeService.listJobCodes(status, customerId, pageable);

        Page<JobCodeResponse> responsePage = jobCodePage.map(JobCodeResponse::from);

        PaginatedResponse<JobCodeResponse> paginatedResponse = PaginatedResponse.<JobCodeResponse>builder()
                .content(responsePage.getContent())
                .totalElements(responsePage.getTotalElements())
                .totalPages(responsePage.getTotalPages())
                .page(responsePage.getNumber())
                .size(responsePage.getSize())
                .build();

        return ApiResponse.success(paginatedResponse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ApiResponse<JobCodeResponse> updateJobCode(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateJobCodeRequest request
    ) {
        log.info("PUT /api/v1/jobcodes/{} - Updating JobCode", id);

        JobCode updatedJobCode = jobCodeService.updateJobCode(id, request);
        JobCodeResponse response = JobCodeResponse.from(updatedJobCode);

        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteJobCode(@PathVariable UUID id) {
        log.info("DELETE /api/v1/jobcodes/{} - Deleting JobCode", id);
        jobCodeService.deleteJobCode(id);
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES', 'FINANCE', 'PRODUCTION')")
    public ApiResponse<JobCodeResponse> getJobCodeByCode(@PathVariable String code) {
        log.info("GET /api/v1/jobcodes/code/{} - Fetching JobCode by code", code);

        JobCode jobCode = jobCodeService.getJobCodeByCode(code)
                .orElseThrow(() -> new com.wellkorea.erp.api.common.exception.ResourceNotFoundException(
                        "JobCode not found with code: " + code));

        JobCodeResponse response = JobCodeResponse.from(jobCode);
        return ApiResponse.success(response);
    }
}
