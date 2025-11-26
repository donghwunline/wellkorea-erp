package com.wellkorea.erp.api.jobcode.dto;

import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobCodeResponse {

    private UUID id;
    private String code;
    private String projectName;
    private CustomerInfo customer;
    private UserInfo owner;
    private LocalDate dueDate;
    private JobCodeStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfo {
        private UUID id;
        private String name;
        private String companyRegistrationNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String username;
        private String email;
    }

    public static JobCodeResponse from(JobCode jobCode) {
        return JobCodeResponse.builder()
                .id(jobCode.getId())
                .code(jobCode.getJobcode())
                .projectName(jobCode.getProjectName())
                .customer(CustomerInfo.builder()
                        .id(jobCode.getCustomer().getId())
                        .name(jobCode.getCustomer().getName())
                        .companyRegistrationNumber(jobCode.getCustomer().getCompanyRegistrationNumber())
                        .build())
                .owner(UserInfo.builder()
                        .id(jobCode.getInternalOwner().getId())
                        .username(jobCode.getInternalOwner().getUsername())
                        .email(jobCode.getInternalOwner().getEmail())
                        .build())
                .dueDate(jobCode.getRequestedDueDate())
                .status(jobCode.getStatus())
                .description(jobCode.getDescription())
                .createdAt(jobCode.getCreatedAt())
                .updatedAt(jobCode.getUpdatedAt())
                .build();
    }
}
