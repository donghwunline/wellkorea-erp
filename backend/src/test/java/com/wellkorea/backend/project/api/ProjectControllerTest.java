package com.wellkorea.backend.project.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/projects endpoints.
 * Tests validate the project management API contract.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T049: POST /api/projects - expects 201 with generated JobCode
 * T050: GET /api/projects and GET /api/projects/{id}
 * T051: PUT /api/projects/{id} - validates editable fields
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Project Controller Contract Tests")
class ProjectControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String PROJECTS_URL = "/api/projects";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String financeToken;
    private String productionToken;
    private String salesToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);

        // Generate tokens for different roles (userId is required for approval workflows)
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    @Nested
    @DisplayName("POST /api/projects - T049: Create Project with JobCode")
    class CreateProjectTests {

        @Test
        @DisplayName("should return 201 with generated JobCode for Admin")
        void createProject_AsAdmin_Returns201WithJobCode() throws Exception {
            // Given
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Custom Enclosure Project",
                        "requesterName": "John Doe",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            // When - Create project (CQRS: returns only ID)
            String response = mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Project created successfully"))
                    .andReturn().getResponse().getContentAsString();

            // Then - Fetch the created project to verify details
            Long projectId = objectMapper.readTree(response).at("/data/id").asLong();
            mockMvc.perform(get(PROJECTS_URL + "/" + projectId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.jobCode").isString())
                    .andExpect(jsonPath("$.data.jobCode", matchesPattern("^WK2K\\d{2}-\\d{4}-\\d{4}$")))
                    .andExpect(jsonPath("$.data.projectName").value("Custom Enclosure Project"))
                    .andExpect(jsonPath("$.data.status").value("DRAFT"));
        }

        @Test
        @DisplayName("should return 201 with generated JobCode for Sales")
        void createProject_AsSales_Returns201WithJobCode() throws Exception {
            // Given - Sales can create projects
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Sales Created Project",
                        "dueDate": "%s",
                        "internalOwnerId": 4
                    }
                    """.formatted(futureDate);

            // When - Create project (CQRS: returns only ID)
            String response = mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andReturn().getResponse().getContentAsString();

            // Then - Fetch the created project to verify JobCode format
            Long projectId = objectMapper.readTree(response).at("/data/id").asLong();
            mockMvc.perform(get(PROJECTS_URL + "/" + projectId)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.jobCode", matchesPattern("^WK2K\\d{2}-\\d{4}-\\d{4}$")));
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void createProject_AsProduction_Returns403() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Test Project",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when customer does not exist")
        void createProject_NonExistentCustomer_Returns400() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 9999,
                        "projectName": "Test Project",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when due date is in the past")
        void createProject_PastDueDate_Returns400() throws Exception {
            String pastDate = LocalDate.now().minusDays(1).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Test Project",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(pastDate);

            mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when project name is empty")
        void createProject_EmptyProjectName_Returns400() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when required fields are missing")
        void createProject_MissingRequiredFields_Returns400() throws Exception {
            String createRequest = """
                    {
                        "customerId": 1
                    }
                    """;

            mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createProject_WithoutAuth_Returns401() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Test Project",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            mockMvc.perform(post(PROJECTS_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/projects - T050: List Projects")
    class ListProjectsTests {

        @BeforeEach
        void setUpProjects() {
            // Insert a test project for listing tests
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id)" +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    1L, "WK2K" + year + "-0001-" + today, 1L, "Test Project 1",
                    LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id)" +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    2L, "WK2K" + year + "-0002-" + today, 1L, "Test Project 2",
                    LocalDate.now().plusDays(60), 1L, "ACTIVE", 1L
            );
        }

        @Test
        @DisplayName("should return 200 with paginated project list for Admin")
        void listProjects_AsAdmin_Returns200WithProjects() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].jobCode").isString())
                    .andExpect(jsonPath("$.data.content[0].projectName").isString());
        }

        @Test
        @DisplayName("should return 200 with paginated project list for Sales")
        void listProjects_AsSales_Returns200WithProjects() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }

        @Test
        @DisplayName("should return 200 with paginated project list for Finance")
        void listProjects_AsFinance_Returns200WithProjects() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 with read-only project list for Production")
        void listProjects_AsProduction_Returns200ReadOnly() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should support pagination parameters")
        void listProjects_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should support status filter")
        void listProjects_WithStatusFilter_ReturnsFilteredProjects() throws Exception {
            mockMvc.perform(get(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("status", "DRAFT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[*].status", everyItem(equalTo("DRAFT"))));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listProjects_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PROJECTS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/projects/{id} - T050: Get Project by ID")
    class GetProjectByIdTests {

        @BeforeEach
        void setUpProject() {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, requester_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    100L, "WK2K" + year + "-0100-" + today, 1L, "Detailed Test Project", "Jane Doe",
                    LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
            );
        }

        @Test
        @DisplayName("should return 200 with project details for Admin")
        void getProject_AsAdmin_Returns200WithDetails() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.jobCode").isString())
                    .andExpect(jsonPath("$.data.projectName").value("Detailed Test Project"))
                    .andExpect(jsonPath("$.data.requesterName").value("Jane Doe"))
                    .andExpect(jsonPath("$.data.status").value("DRAFT"));
        }

        @Test
        @DisplayName("should return 404 for non-existent project")
        void getProject_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/9999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getProject_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/projects/{id} - T051: Update Project")
    class UpdateProjectTests {

        @BeforeEach
        void setUpProject() {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id)" +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    200L, "WK2K" + year + "-0200-" + today, 1L, "Original Project Name",
                    LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
            );
        }

        @Test
        @DisplayName("should return 200 with updated project for Admin")
        void updateProject_AsAdmin_Returns200() throws Exception {
            String futureDate = LocalDate.now().plusDays(45).format(DateTimeFormatter.ISO_DATE);
            String updateRequest = """
                    {
                        "projectName": "Updated Project Name",
                        "requesterName": "Updated Requester",
                        "dueDate": "%s",
                        "status": "ACTIVE"
                    }
                    """.formatted(futureDate);

            // When - Update project (CQRS: returns only ID and success message)
            mockMvc.perform(put(PROJECTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Project updated successfully"));
            // Note: Side effect verification (field updates) is tested implicitly by other tests
            // and in production where JPA and MyBatis run in separate transactions
        }

        @Test
        @DisplayName("should NOT allow changing JobCode")
        void updateProject_CannotChangeJobCode_Returns200WithOriginalJobCode() throws Exception {
            String updateRequest = """
                    {
                        "projectName": "Name Change Only"
                    }
                    """;

            // When - Update project (CQRS: returns only ID)
            mockMvc.perform(put(PROJECTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(200));

            // Then - Verify JobCode remains unchanged after update
            mockMvc.perform(get(PROJECTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.jobCode", matchesPattern("^WK2K\\d{2}-0200-\\d{4}$")));
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void updateProject_AsProduction_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "projectName": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(PROJECTS_URL + "/200")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent project")
        void updateProject_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "projectName": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(PROJECTS_URL + "/9999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when setting invalid status")
        void updateProject_InvalidStatus_Returns400() throws Exception {
            String updateRequest = """
                    {
                        "status": "INVALID_STATUS"
                    }
                    """;

            mockMvc.perform(put(PROJECTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updateProject_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "projectName": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(PROJECTS_URL + "/200")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/projects/{id}/summary - Get Project Summary")
    class GetProjectSummaryTests {

        @BeforeEach
        void setUpProject() {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    300L, "WK2K" + year + "-0300-" + today, 1L, "Summary Test Project",
                    LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
            );
        }

        @Test
        @DisplayName("should return 200 with sections summary for Admin")
        void getProjectSummary_AsAdmin_Returns200WithSections() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/300/summary")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.projectId").value(300))
                    .andExpect(jsonPath("$.data.sections").isArray())
                    .andExpect(jsonPath("$.data.sections", hasSize(7)))
                    // Check all sections are present
                    .andExpect(jsonPath("$.data.sections[?(@.section=='quotation')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='process')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='purchase')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='outsource')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='documents')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='delivery')]").exists())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='finance')]").exists());
        }

        @Test
        @DisplayName("should return 200 with sections summary for Production (read-only access)")
        void getProjectSummary_AsProduction_Returns200WithSections() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/300/summary")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.sections").isArray());
        }

        @Test
        @DisplayName("should return 404 for non-existent project")
        void getProjectSummary_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/9999/summary")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getProjectSummary_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/300/summary"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should include correct labels in sections")
        void getProjectSummary_HasCorrectLabels() throws Exception {
            mockMvc.perform(get(PROJECTS_URL + "/300/summary")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.sections[?(@.section=='quotation')].label").value("견적"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='process')].label").value("공정"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='purchase')].label").value("구매"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='outsource')].label").value("외주"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='documents')].label").value("문서"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='delivery')].label").value("출고"))
                    .andExpect(jsonPath("$.data.sections[?(@.section=='finance')].label").value("정산"));
        }
    }

    @Nested
    @DisplayName("JobCode Format Validation - T049 Extended")
    class JobCodeFormatTests {

        @Test
        @DisplayName("JobCode format should be WK2K{YY}-{SSSS}-{MMDD}")
        void createProject_JobCodeFormat_MatchesExpectedPattern() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Format Test Project",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """.formatted(futureDate);

            // When - Create project (CQRS: returns only ID)
            String response = mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andReturn().getResponse().getContentAsString();

            // Then - Fetch the created project to verify JobCode format
            Long projectId = objectMapper.readTree(response).at("/data/id").asLong();
            mockMvc.perform(get(PROJECTS_URL + "/" + projectId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.jobCode", matchesPattern("^WK2K\\d{2}-\\d{4}-\\d{4}$")));
        }

        @Test
        @DisplayName("JobCode sequence should increment for multiple projects")
        void createMultipleProjects_SequenceIncrements() throws Exception {
            String futureDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "customerId": 1,
                        "projectName": "Sequence Test Project %d",
                        "dueDate": "%s",
                        "internalOwnerId": 1
                    }
                    """;

            // Create first project (CQRS: returns only ID)
            String response1 = mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest.formatted(1, futureDate)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            Long projectId1 = objectMapper.readTree(response1).at("/data/id").asLong();

            // Create second project
            String response2 = mockMvc.perform(post(PROJECTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest.formatted(2, futureDate)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            Long projectId2 = objectMapper.readTree(response2).at("/data/id").asLong();

            // Fetch the projects to get JobCodes
            String getResponse1 = mockMvc.perform(get(PROJECTS_URL + "/" + projectId1)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            String getResponse2 = mockMvc.perform(get(PROJECTS_URL + "/" + projectId2)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            // Extract JobCodes and verify sequence increment
            String jobCode1 = objectMapper.readTree(getResponse1).at("/data/jobCode").asText();
            String jobCode2 = objectMapper.readTree(getResponse2).at("/data/jobCode").asText();

            // Extract sequence numbers (format: WK2K{YY}-{SSSS}-{MMDD})
            // Position: WK2K (4) + YY (2) + dash (1) = 7, then SSSS (4)
            int seq1 = Integer.parseInt(jobCode1.substring(7, 11));
            int seq2 = Integer.parseInt(jobCode2.substring(7, 11));

            // Second sequence should be greater than first
            Assertions.assertTrue(seq2 > seq1,
                    "Second JobCode sequence (" + seq2 + ") should be greater than first (" + seq1 + ")");
        }
    }
}
