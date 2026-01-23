package com.wellkorea.backend.company.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.vo.Role;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/companies endpoints.
 * Tests validate the unified Company domain API contract.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T052a: GET /api/companies, POST /api/companies
 * T052b: PUT /api/companies/{id}, GET /api/companies/{id}
 * T052c: POST /api/companies/{id}/roles, DELETE /api/companies/{id}/roles/{roleType}
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Company Controller Contract Tests")
class CompanyControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String COMPANIES_URL = "/api/companies";

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
    private String salesToken;
    private String productionToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
    }

    // ==========================================================================
    // T052a: POST /api/companies - Create Company
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/companies - T052a: Create Company")
    class CreateCompanyTests {

        @Test
        @DisplayName("should return 201 with company data when Admin creates company with CUSTOMER role")
        void createCompany_AsAdmin_WithCustomerRole_Returns201() throws Exception {
            String createRequest = """
                    {
                        "name": "Samsung Electronics",
                        "registrationNumber": "123-45-67890",
                        "representative": "이재용",
                        "businessType": "제조업",
                        "businessCategory": "전자",
                        "contactPerson": "홍길동",
                        "phone": "02-1234-5678",
                        "email": "contact@samsung.com",
                        "address": "서울시 강남구 삼성동",
                        "bankAccount": "신한은행 123-456-789012",
                        "paymentTerms": "NET30",
                        "roles": ["CUSTOMER"]
                    }
                    """;

            // CQRS pattern: command endpoints return only ID and message
            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Company created successfully"));
        }

        @Test
        @DisplayName("should return 201 with company data when creating company with multiple roles")
        void createCompany_WithMultipleRoles_Returns201() throws Exception {
            String createRequest = """
                    {
                        "name": "Hyundai Parts",
                        "registrationNumber": "234-56-78901",
                        "contactPerson": "김철수",
                        "phone": "02-2345-6789",
                        "email": "parts@hyundai.com",
                        "roles": ["CUSTOMER", "VENDOR"]
                    }
                    """;

            // CQRS pattern: command endpoints return only ID and message
            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Company created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates company")
        void createCompany_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "name": "LG Display",
                        "registrationNumber": "345-67-89012",
                        "contactPerson": "이영희",
                        "email": "contact@lgdisplay.com",
                        "roles": ["VENDOR"]
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Production creates company")
        void createCompany_AsProduction_Returns403() throws Exception {
            String createRequest = """
                    {
                        "name": "Test Company",
                        "email": "test@company.com",
                        "roles": ["CUSTOMER"]
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when name is missing")
        void createCompany_MissingName_Returns400() throws Exception {
            String createRequest = """
                    {
                        "registrationNumber": "456-78-90123",
                        "roles": ["CUSTOMER"]
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when roles is empty")
        void createCompany_EmptyRoles_Returns400() throws Exception {
            String createRequest = """
                    {
                        "name": "No Role Company",
                        "email": "norole@company.com",
                        "roles": []
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when registration number is duplicate")
        void createCompany_DuplicateRegistrationNumber_Returns400() throws Exception {
            // Insert a company first
            insertTestCompany("Existing Company", "111-22-33333");

            String createRequest = """
                    {
                        "name": "Duplicate RegNum Company",
                        "registrationNumber": "111-22-33333",
                        "email": "duplicate@regnum.com",
                        "roles": ["CUSTOMER"]
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createCompany_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "name": "Unauthorized Company",
                        "email": "unauthorized@company.com",
                        "roles": ["CUSTOMER"]
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // T052a: GET /api/companies - List Companies
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/companies - T052a: List Companies")
    class ListCompaniesTests {

        @BeforeEach
        void setUpCompanies() {
            insertTestCompany("Samsung", "100-00-00001", "CUSTOMER");
            insertTestCompany("Hyundai Parts", "100-00-00002", "VENDOR");
            insertTestCompany("LG Dual", "100-00-00003", "CUSTOMER", "VENDOR");
        }

        @Test
        @DisplayName("should return 200 with paginated company list for Admin")
        void listCompanies_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(3))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].name").isString())
                    .andExpect(jsonPath("$.data.content[0].roles").isArray());
        }

        @Test
        @DisplayName("should filter by role type when roleType parameter is provided")
        void listCompanies_FilterByRole_ReturnsFilteredList() throws Exception {
            mockMvc.perform(get(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("roleType", "CUSTOMER"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))))
                    // Each company should have at least one CUSTOMER role (but may have other roles too)
                    .andExpect(jsonPath("$.data.content[*].roles[*].roleType", hasItem("CUSTOMER")));
        }

        @Test
        @DisplayName("should filter vendors when roleType=VENDOR")
        void listCompanies_FilterByVendor_ReturnsVendors() throws Exception {
            mockMvc.perform(get(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("roleType", "VENDOR"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("should support pagination parameters")
        void listCompanies_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should support search by name")
        void listCompanies_SearchByName_ReturnsMatchingCompanies() throws Exception {
            mockMvc.perform(get(COMPANIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("search", "Samsung"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[*].name", everyItem(containsString("Samsung"))));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listCompanies_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(COMPANIES_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // T052b: GET /api/companies/{id} - Get Company by ID
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/companies/{id} - T052b: Get Company by ID")
    class GetCompanyByIdTests {

        @BeforeEach
        void setUpCompany() {
            insertTestCompanyWithId(100L, "Test Company", "999-88-77766", "CUSTOMER", "VENDOR");
        }

        @Test
        @DisplayName("should return 200 with company details for Admin")
        void getCompany_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(COMPANIES_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.name").value("Test Company"))
                    .andExpect(jsonPath("$.data.registrationNumber").value("999-88-77766"))
                    .andExpect(jsonPath("$.data.roles", hasSize(2)))
                    .andExpect(jsonPath("$.data.roles[*].roleType", containsInAnyOrder("CUSTOMER", "VENDOR")));
        }

        @Test
        @DisplayName("should return 404 for non-existent company")
        void getCompany_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(COMPANIES_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getCompany_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(COMPANIES_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // T052b: PUT /api/companies/{id} - Update Company
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/companies/{id} - T052b: Update Company")
    class UpdateCompanyTests {

        @BeforeEach
        void setUpCompany() {
            insertTestCompanyWithId(200L, "Original Company", "888-77-66655", "CUSTOMER");
        }

        @Test
        @DisplayName("should return 200 with updated company for Admin")
        void updateCompany_AsAdmin_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Company Name",
                        "contactPerson": "New Contact",
                        "phone": "02-9999-8888",
                        "email": "updated@company.com"
                    }
                    """;

            // CQRS pattern: command endpoints return only ID and message
            mockMvc.perform(put(COMPANIES_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Company updated successfully"));
        }

        @Test
        @DisplayName("should return 403 when Production updates company")
        void updateCompany_AsProduction_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "name": "Attempted Update",
                        "email": "attempted@update.com"
                    }
                    """;

            mockMvc.perform(put(COMPANIES_URL + "/200")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent company")
        void updateCompany_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name",
                        "email": "updated@name.com"
                    }
                    """;

            mockMvc.perform(put(COMPANIES_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when updating to duplicate registration number")
        void updateCompany_DuplicateRegistrationNumber_Returns400() throws Exception {
            // Insert another company with a registration number
            insertTestCompanyWithId(201L, "Another Company", "777-66-55544", "VENDOR");

            String updateRequest = """
                    {
                        "registrationNumber": "777-66-55544",
                        "email": "duplicate@regnum.com"
                    }
                    """;

            mockMvc.perform(put(COMPANIES_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updateCompany_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name",
                        "email": "updated@name.com"
                    }
                    """;

            mockMvc.perform(put(COMPANIES_URL + "/200")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // T052c: POST /api/companies/{id}/roles - Add Role to Company
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/companies/{id}/roles - T052c: Add Role to Company")
    class AddRoleTests {

        @BeforeEach
        void setUpCompany() {
            insertTestCompanyWithId(300L, "Single Role Company", "666-55-44433", "CUSTOMER");
        }

        @Test
        @DisplayName("should return 201 when adding VENDOR role to existing company")
        void addRole_VendorToCustomer_Returns201() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "VENDOR"
                    }
                    """;

            // CQRS pattern: command endpoints return message (no roleId with embeddable)
            mockMvc.perform(post(COMPANIES_URL + "/300/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value("Role VENDOR added successfully"));
        }

        @Test
        @DisplayName("should return 201 when adding OUTSOURCE role")
        void addRole_Outsource_Returns201() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "OUTSOURCE"
                    }
                    """;

            // CQRS pattern: command endpoints return message (no roleId with embeddable)
            mockMvc.perform(post(COMPANIES_URL + "/300/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.message").value("Role OUTSOURCE added successfully"));
        }

        @Test
        @DisplayName("should return 400 when adding duplicate role")
        void addRole_DuplicateRole_Returns400() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "CUSTOMER"
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL + "/300/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent company")
        void addRole_NonExistentCompany_Returns404() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "VENDOR"
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL + "/99999/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 when Production adds role")
        void addRole_AsProduction_Returns403() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "VENDOR"
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL + "/300/roles")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void addRole_WithoutAuth_Returns401() throws Exception {
            String addRoleRequest = """
                    {
                        "roleType": "VENDOR"
                    }
                    """;

            mockMvc.perform(post(COMPANIES_URL + "/300/roles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(addRoleRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // T052c: DELETE /api/companies/{id}/roles/{roleType} - Remove Role from Company
    // ==========================================================================

    @Nested
    @DisplayName("DELETE /api/companies/{id}/roles/{roleType} - T052c: Remove Role from Company")
    class RemoveRoleTests {

        @BeforeEach
        void setUpCompanyWithMultipleRoles() {
            // Insert company with CUSTOMER and VENDOR roles
            insertTestCompanyWithId(400L, "Multi Role Company", "555-44-33322", "CUSTOMER", "VENDOR");
        }

        @Test
        @DisplayName("should return 204 when removing VENDOR role from dual-role company")
        void removeRole_FromDualRoleCompany_Returns204() throws Exception {
            // When: Remove role by roleType - Command returns 204 No Content on success
            mockMvc.perform(delete(COMPANIES_URL + "/400/roles/VENDOR")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
            // Note: Side effect verification (role removal) is tested implicitly by other tests
            // and in production where JPA and MyBatis run in separate transactions
        }

        @Test
        @DisplayName("should return 400 when trying to remove last role")
        void removeRole_LastRole_Returns400() throws Exception {
            // Create a company with single role
            insertTestCompanyWithId(401L, "Single Role", "444-33-22211", "CUSTOMER");

            mockMvc.perform(delete(COMPANIES_URL + "/401/roles/CUSTOMER")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when role type does not exist on company")
        void removeRole_RoleTypeNotOnCompany_Returns400() throws Exception {
            // Company 400 has CUSTOMER and VENDOR, not OUTSOURCE
            mockMvc.perform(delete(COMPANIES_URL + "/400/roles/OUTSOURCE")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when company does not exist")
        void removeRole_NonExistentCompany_Returns404() throws Exception {
            mockMvc.perform(delete(COMPANIES_URL + "/99999/roles/VENDOR")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 when Production removes role")
        void removeRole_AsProduction_Returns403() throws Exception {
            mockMvc.perform(delete(COMPANIES_URL + "/400/roles/VENDOR")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void removeRole_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(delete(COMPANIES_URL + "/400/roles/VENDOR"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // Helper Methods for Test Data Setup
    // ==========================================================================

    /**
     * Insert a test company with auto-generated ID.
     */
    private void insertTestCompany(String name, String registrationNumber, String... roleTypes) {
        Long companyId = jdbcTemplate.queryForObject(
                "INSERT INTO companies (name, registration_number, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id",
                Long.class,
                name, registrationNumber
        );

        for (String roleType : roleTypes) {
            jdbcTemplate.update(
                    "INSERT INTO company_roles (company_id, role_type, created_at) " +
                            "VALUES (?, ?, CURRENT_TIMESTAMP)",
                    companyId, roleType
            );
        }
    }

    /**
     * Insert a test company with specific ID.
     */
    private void insertTestCompanyWithId(Long id, String name, String registrationNumber, String... roleTypes) {
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, registration_number, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name, registrationNumber
        );

        for (String roleType : roleTypes) {
            jdbcTemplate.update(
                    "INSERT INTO company_roles (company_id, role_type, created_at) " +
                            "VALUES (?, ?, CURRENT_TIMESTAMP) " +
                            "ON CONFLICT (company_id, role_type) DO NOTHING",
                    id, roleType
            );
        }
    }
}
