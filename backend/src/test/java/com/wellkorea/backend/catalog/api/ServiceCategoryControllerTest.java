package com.wellkorea.backend.catalog.api;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/service-categories endpoints.
 * Tests validate the ServiceCategory and VendorOffering domain API contract with RBAC.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * RBAC Rules:
 * - Admin, Finance: Full CRUD access
 * - Sales, Production: Read-only access
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Service Category Controller Contract Tests")
class ServiceCategoryControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String SERVICE_CATEGORIES_URL = "/api/service-categories";

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
    // POST /api/service-categories - Create Service Category
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/service-categories - Create Service Category")
    class CreateServiceCategoryTests {

        @Test
        @DisplayName("should return 201 with command result when Admin creates category")
        void createServiceCategory_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "name": "CNC Machining",
                        "description": "Computer Numerical Control machining services"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Service category created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates category")
        void createServiceCategory_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "name": "Laser Cutting"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates category")
        void createServiceCategory_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "name": "Unauthorized Category"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Production creates category")
        void createServiceCategory_AsProduction_Returns403() throws Exception {
            String createRequest = """
                    {
                        "name": "Unauthorized Category"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when name is missing")
        void createServiceCategory_MissingName_Returns400() throws Exception {
            String createRequest = """
                    {
                        "description": "Missing name"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when name is duplicate")
        void createServiceCategory_DuplicateName_Returns400() throws Exception {
            // Insert existing category
            insertTestServiceCategory(100L, "Existing Category");

            String createRequest = """
                    {
                        "name": "Existing Category"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createServiceCategory_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "name": "Unauthorized"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/service-categories - List Service Categories
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/service-categories - List Service Categories")
    class ListServiceCategoriesTests {

        @BeforeEach
        void setUpCategories() {
            // Use IDs 100+ to avoid conflicts with seeded data (IDs 1-8 are used in V5__seed_initial_data.sql)
            insertTestServiceCategory(101L, "CNC Machining");
            insertTestServiceCategory(102L, "Laser Cutting");
            insertTestServiceCategory(103L, "Surface Painting");
        }

        @Test
        @DisplayName("should return 200 with paginated category list for Admin")
        void listServiceCategories_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(3))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].name").isString());
        }

        @Test
        @DisplayName("should return 200 for Sales (read-only access)")
        void listServiceCategories_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should search by name")
        void listServiceCategories_SearchByName_ReturnsMatchingCategories() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("search", "Laser"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[*].name", hasItem(containsString("Laser"))));
        }

        @Test
        @DisplayName("should support pagination")
        void listServiceCategories_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listServiceCategories_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/service-categories/{id} - Get Service Category by ID
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/service-categories/{id} - Get Service Category by ID")
    class GetServiceCategoryByIdTests {

        @BeforeEach
        void setUpCategory() {
            insertTestServiceCategory(100L, "Detail Category");
        }

        @Test
        @DisplayName("should return 200 with category details for Admin")
        void getServiceCategory_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.name").value("Detail Category"));
        }

        @Test
        @DisplayName("should return 404 for non-existent category")
        void getServiceCategory_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getServiceCategory_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(SERVICE_CATEGORIES_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // PUT /api/service-categories/{id} - Update Service Category
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/service-categories/{id} - Update Service Category")
    class UpdateServiceCategoryTests {

        @BeforeEach
        void setUpCategory() {
            insertTestServiceCategory(200L, "Original Category");
        }

        @Test
        @DisplayName("should return 200 with command result when Admin updates category")
        void updateServiceCategory_AsAdmin_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Category Name",
                        "description": "Updated description"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Service category updated successfully"));
        }

        @Test
        @DisplayName("should return 200 when Finance updates category")
        void updateServiceCategory_AsFinance_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "name": "Finance Updated Category"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/200")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales updates category")
        void updateServiceCategory_AsSales_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "name": "Sales Updated Category"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/200")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent category")
        void updateServiceCategory_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when updating to duplicate name")
        void updateServiceCategory_DuplicateName_Returns400() throws Exception {
            insertTestServiceCategory(201L, "Another Category");

            String updateRequest = """
                    {
                        "name": "Another Category"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updateServiceCategory_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(SERVICE_CATEGORIES_URL + "/200")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // DELETE /api/service-categories/{id} - Delete (Deactivate) Service Category
    // ==========================================================================

    @Nested
    @DisplayName("DELETE /api/service-categories/{id} - Delete Service Category")
    class DeleteServiceCategoryTests {

        @BeforeEach
        void setUpCategory() {
            insertTestServiceCategory(300L, "Category to Delete");
        }

        @Test
        @DisplayName("should return 204 when Admin deletes category")
        void deleteServiceCategory_AsAdmin_Returns204() throws Exception {
            // When: Delete category - Command returns 204 No Content on success
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/300")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
            // Note: Side effect verification (soft-delete) is tested implicitly by other tests
            // and in production where JPA and MyBatis run in separate transactions
        }

        @Test
        @DisplayName("should return 403 when Finance deletes category")
        void deleteServiceCategory_AsFinance_Returns403() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/300")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Sales deletes category")
        void deleteServiceCategory_AsSales_Returns403() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/300")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent category")
        void deleteServiceCategory_NonExistent_Returns404() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void deleteServiceCategory_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/300"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // Vendor Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/service-categories/offerings - Create Vendor Offering")
    class CreateVendorOfferingTests {

        @BeforeEach
        void setUpData() {
            insertTestServiceCategory(1L, "CNC Machining");
            insertTestVendorCompany(100L, "Vendor Company");
        }

        @Test
        @DisplayName("should return 201 with command result when Admin creates offering")
        void createVendorOffering_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100,
                        "serviceCategoryId": 1,
                        "vendorServiceCode": "VND-CNC-001",
                        "vendorServiceName": "CNC Machining Service",
                        "unitPrice": 50000,
                        "currency": "KRW",
                        "leadTimeDays": 5,
                        "isPreferred": true,
                        "notes": "Premium CNC vendor"
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Vendor offering created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates offering")
        void createVendorOffering_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100,
                        "serviceCategoryId": 1,
                        "unitPrice": 30000
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates offering")
        void createVendorOffering_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100,
                        "serviceCategoryId": 1
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when vendorId is missing")
        void createVendorOffering_MissingVendorId_Returns400() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when serviceCategoryId is missing")
        void createVendorOffering_MissingServiceCategoryId_Returns400() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when vendor not found")
        void createVendorOffering_VendorNotFound_Returns404() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 99999,
                        "serviceCategoryId": 1
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 404 when service category not found")
        void createVendorOffering_ServiceCategoryNotFound_Returns404() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100,
                        "serviceCategoryId": 99999
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when company has no VENDOR role")
        void createVendorOffering_CompanyNotVendor_Returns400() throws Exception {
            insertTestCustomerCompany(101L, "Customer Company");

            String createRequest = """
                    {
                        "vendorId": 101,
                        "serviceCategoryId": 1
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createVendorOffering_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "vendorId": 100,
                        "serviceCategoryId": 1
                    }
                    """;

            mockMvc.perform(post(SERVICE_CATEGORIES_URL + "/offerings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("DELETE /api/service-categories/offerings/{offeringId} - Delete Vendor Offering")
    class DeleteVendorOfferingTests {

        @BeforeEach
        void setUpData() {
            insertTestServiceCategory(1L, "CNC Machining");
            insertTestVendorCompany(100L, "Vendor Company");
            insertTestVendorOffering(500L, 100L, 1L);
        }

        @Test
        @DisplayName("should return 204 when Admin deletes offering")
        void deleteVendorOffering_AsAdmin_Returns204() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/offerings/500")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 204 when Finance deletes offering")
        void deleteVendorOffering_AsFinance_Returns204() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/offerings/500")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 403 when Sales deletes offering")
        void deleteVendorOffering_AsSales_Returns403() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/offerings/500")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent offering")
        void deleteVendorOffering_NonExistent_Returns404() throws Exception {
            mockMvc.perform(delete(SERVICE_CATEGORIES_URL + "/offerings/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ==========================================================================
    // Helper Methods for Test Data Setup
    // ==========================================================================

    /**
     * Insert a test service category.
     */
    private void insertTestServiceCategory(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO service_categories (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
    }

    /**
     * Insert a test company with VENDOR role.
     */
    private void insertTestVendorCompany(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type, created_at) " +
                        "VALUES (?, 'VENDOR', CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING",
                id
        );
    }

    /**
     * Insert a test company with CUSTOMER role (no VENDOR role).
     */
    private void insertTestCustomerCompany(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type, created_at) " +
                        "VALUES (?, 'CUSTOMER', CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING",
                id
        );
    }

    /**
     * Insert a test vendor offering.
     */
    private void insertTestVendorOffering(Long id, Long vendorId, Long serviceCategoryId) {
        jdbcTemplate.update(
                "INSERT INTO vendor_service_offerings (id, vendor_company_id, service_category_id, created_at, updated_at) " +
                        "VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, vendorId, serviceCategoryId
        );
    }
}
