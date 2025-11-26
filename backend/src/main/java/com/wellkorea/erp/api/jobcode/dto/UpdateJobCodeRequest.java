package com.wellkorea.erp.api.jobcode.dto;

import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateJobCodeRequest {

    private String projectName;

    private UUID customerId;

    private UUID ownerId;

    private LocalDate dueDate;

    private String description;

    private JobCodeStatus status;
}
