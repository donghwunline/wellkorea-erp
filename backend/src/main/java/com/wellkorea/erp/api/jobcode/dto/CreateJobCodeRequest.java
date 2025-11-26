package com.wellkorea.erp.api.jobcode.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateJobCodeRequest {

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotNull(message = "Owner ID is required")
    private UUID ownerId;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String description;
}
