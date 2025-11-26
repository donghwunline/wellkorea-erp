package com.wellkorea.erp.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.erp.api.jobcode.dto.CreateJobCodeRequest;
import com.wellkorea.erp.api.jobcode.dto.UpdateJobCodeRequest;
import com.wellkorea.erp.application.jobcode.JobCodeService;
import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import com.wellkorea.erp.domain.customer.Customer;
import com.wellkorea.erp.domain.user.User;
import com.wellkorea.erp.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("JobCode API Contract Tests")
class JobCodeContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobCodeService jobCodeService;

    private JobCode sampleJobCode;
    private UUID jobCodeId;
    private UUID customerId;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        jobCodeId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        ownerId = UUID.randomUUID();

        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setName("Sample Customer Ltd.");

        User owner = new User();
        owner.setId(ownerId);
        owner.setUsername("testowner");

        sampleJobCode = new JobCode();
        sampleJobCode.setId(jobCodeId);
        sampleJobCode.setJobcode("WK2K25-0001-250126");
        sampleJobCode.setProjectName("Sample Project");
        sampleJobCode.setCustomer(customer);
        sampleJobCode.setInternalOwner(owner);
        sampleJobCode.setRequestedDueDate(LocalDate.now().plusDays(30));
        sampleJobCode.setStatus(JobCodeStatus.DRAFT);
        sampleJobCode.setDescription("Test project description");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/v1/jobcodes should create JobCode and return 201 with valid schema")
    void testCreateJobCode_ValidRequest_Returns201() throws Exception {
        // Given
        CreateJobCodeRequest request = CreateJobCodeRequest.builder()
                .projectName("New Project")
                .customerId(customerId)
                .ownerId(ownerId)
                .dueDate(LocalDate.now().plusDays(30))
                .description("Project description")
                .build();

        when(jobCodeService.createJobCode(any(CreateJobCodeRequest.class)))
                .thenReturn(sampleJobCode);

        // When & Then
        mockMvc.perform(post("/api/v1/jobcodes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(jobCodeId.toString()))
                .andExpect(jsonPath("$.data.code").value("WK2K25-0001-250126"))
                .andExpect(jsonPath("$.data.projectName").value("Sample Project"))
                .andExpect(jsonPath("$.data.customer.id").value(customerId.toString()))
                .andExpect(jsonPath("$.data.customer.name").value("Sample Customer Ltd."))
                .andExpect(jsonPath("$.data.owner.id").value(ownerId.toString()))
                .andExpect(jsonPath("$.data.owner.username").value("testowner"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.description").value("Test project description"))
                .andExpect(jsonPath("$.data.dueDate").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/v1/jobcodes with missing required fields should return 400")
    void testCreateJobCode_MissingRequiredFields_Returns400() throws Exception {
        // Given - missing projectName and customerId
        CreateJobCodeRequest request = CreateJobCodeRequest.builder()
                .ownerId(ownerId)
                .dueDate(LocalDate.now().plusDays(30))
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/jobcodes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/jobcodes/{id} should return JobCode with valid schema")
    void testGetJobCodeById_ValidId_Returns200() throws Exception {
        // Given
        when(jobCodeService.getJobCodeById(jobCodeId)).thenReturn(Optional.of(sampleJobCode));

        // When & Then
        mockMvc.perform(get("/api/v1/jobcodes/{id}", jobCodeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(jobCodeId.toString()))
                .andExpect(jsonPath("$.data.code").value("WK2K25-0001-250126"))
                .andExpect(jsonPath("$.data.projectName").value("Sample Project"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/jobcodes/{id} with invalid ID should return 404")
    void testGetJobCodeById_InvalidId_Returns404() throws Exception {
        // Given
        UUID invalidId = UUID.randomUUID();
        when(jobCodeService.getJobCodeById(invalidId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/v1/jobcodes/{id}", invalidId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/v1/jobcodes/{id} should update JobCode and return 200")
    void testUpdateJobCode_ValidRequest_Returns200() throws Exception {
        // Given
        UpdateJobCodeRequest request = UpdateJobCodeRequest.builder()
                .projectName("Updated Project Name")
                .description("Updated description")
                .dueDate(LocalDate.now().plusDays(45))
                .status(JobCodeStatus.ACTIVE)
                .build();

        JobCode updatedJobCode = new JobCode();
        updatedJobCode.setId(jobCodeId);
        updatedJobCode.setJobcode("WK2K25-0001-250126");
        updatedJobCode.setProjectName("Updated Project Name");
        updatedJobCode.setDescription("Updated description");
        updatedJobCode.setCustomer(sampleJobCode.getCustomer());
        updatedJobCode.setInternalOwner(sampleJobCode.getInternalOwner());
        updatedJobCode.setRequestedDueDate(LocalDate.now().plusDays(45));
        updatedJobCode.setStatus(JobCodeStatus.ACTIVE);

        when(jobCodeService.updateJobCode(eq(jobCodeId), any(UpdateJobCodeRequest.class)))
                .thenReturn(updatedJobCode);

        // When & Then
        mockMvc.perform(put("/api/v1/jobcodes/{id}", jobCodeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(jobCodeId.toString()))
                .andExpect(jsonPath("$.data.projectName").value("Updated Project Name"))
                .andExpect(jsonPath("$.data.description").value("Updated description"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/jobcodes should return paginated list with valid schema")
    void testListJobCodes_WithPagination_Returns200() throws Exception {
        // Given
        JobCode jobCode2 = new JobCode();
        jobCode2.setId(UUID.randomUUID());
        jobCode2.setJobcode("WK2K25-0002-250126");
        jobCode2.setProjectName("Another Project");
        jobCode2.setCustomer(sampleJobCode.getCustomer());
        jobCode2.setInternalOwner(sampleJobCode.getInternalOwner());
        jobCode2.setRequestedDueDate(LocalDate.now().plusDays(20));
        jobCode2.setStatus(JobCodeStatus.ACTIVE);

        PageImpl<JobCode> page = new PageImpl<>(
                List.of(sampleJobCode, jobCode2),
                PageRequest.of(0, 20),
                2
        );

        when(jobCodeService.listJobCodes(any(), any(), any())).thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/jobcodes")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].id").value(jobCodeId.toString()))
                .andExpect(jsonPath("$.data.content[0].code").value("WK2K25-0001-250126"))
                .andExpect(jsonPath("$.data.content[1].code").value("WK2K25-0002-250126"))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/jobcodes with status filter should return filtered results")
    void testListJobCodes_WithStatusFilter_Returns200() throws Exception {
        // Given
        PageImpl<JobCode> page = new PageImpl<>(
                List.of(sampleJobCode),
                PageRequest.of(0, 20),
                1
        );

        when(jobCodeService.listJobCodes(eq(JobCodeStatus.DRAFT), any(), any())).thenReturn(page);

        // When & Then
        mockMvc.perform(get("/api/v1/jobcodes")
                        .param("status", "DRAFT")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].status").value("DRAFT"));
    }

    @Test
    @DisplayName("GET /api/v1/jobcodes without authentication should return 401")
    void testListJobCodes_Unauthenticated_Returns401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/jobcodes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "SALES")
    @DisplayName("POST /api/v1/jobcodes with insufficient permissions should return 403")
    void testCreateJobCode_InsufficientPermissions_Returns403() throws Exception {
        // Given
        CreateJobCodeRequest request = CreateJobCodeRequest.builder()
                .projectName("New Project")
                .customerId(customerId)
                .ownerId(ownerId)
                .dueDate(LocalDate.now().plusDays(30))
                .build();

        // When & Then - Sales role shouldn't be able to create JobCodes
        mockMvc.perform(post("/api/v1/jobcodes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
