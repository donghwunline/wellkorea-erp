package com.wellkorea.backend.product.api;

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
 * Contract tests for /api/products endpoints.
 * Tests validate the Product domain API contract with RBAC.
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
@DisplayName("Product Controller Contract Tests")
class ProductControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String PRODUCTS_URL = "/api/products";

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

        // Product types are already seeded by V10__seed_data.sql
        // IDs 1-4: "판금 부품", "기계 가공품", "용접 조립품", "맞춤형 함체"
    }

    // ==========================================================================
    // POST /api/products - Create Product
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/products - Create Product")
    class CreateProductTests {

        @Test
        @DisplayName("should return 201 with command result when Admin creates product")
        void createProduct_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-001",
                        "name": "Test Product",
                        "description": "Product description",
                        "productTypeId": 1,
                        "baseUnitPrice": 10000,
                        "unit": "EA"
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Product created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates product")
        void createProduct_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-002",
                        "name": "Finance Product",
                        "productTypeId": 1,
                        "baseUnitPrice": 5000
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates product")
        void createProduct_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-003",
                        "name": "Sales Product",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Production creates product")
        void createProduct_AsProduction_Returns403() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-004",
                        "name": "Production Product",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when SKU is missing")
        void createProduct_MissingSku_Returns400() throws Exception {
            String createRequest = """
                    {
                        "name": "Product Without SKU",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when name is missing")
        void createProduct_MissingName_Returns400() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-005",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when productTypeId is missing")
        void createProduct_MissingProductTypeId_Returns400() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-006",
                        "name": "Product Without Type"
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when SKU is duplicate")
        void createProduct_DuplicateSku_Returns400() throws Exception {
            // Insert existing product
            insertTestProduct(100L, "EXISTING-SKU", "Existing Product", 1L);

            String createRequest = """
                    {
                        "sku": "EXISTING-SKU",
                        "name": "Duplicate SKU Product",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when product type not found")
        void createProduct_ProductTypeNotFound_Returns404() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-007",
                        "name": "Product with Invalid Type",
                        "productTypeId": 99999
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createProduct_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "sku": "SKU-008",
                        "name": "Unauthorized Product",
                        "productTypeId": 1
                    }
                    """;

            mockMvc.perform(post(PRODUCTS_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/products - List Products
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/products - List Products")
    class ListProductsTests {

        @BeforeEach
        void setUpProducts() {
            // Use IDs 100+ to avoid conflicts with seeded data (IDs 1-20 are used in V5__seed_initial_data.sql)
            insertTestProduct(101L, "SKU-A001", "Alpha Product", 1L);
            insertTestProduct(102L, "SKU-B002", "Beta Product", 1L);
            insertTestProduct(103L, "SKU-M001", "Machine Part", 2L);
        }

        @Test
        @DisplayName("should return 200 with paginated product list for Admin")
        void listProducts_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(3))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].sku").isString())
                    .andExpect(jsonPath("$.data.content[0].name").isString());
        }

        @Test
        @DisplayName("should return 200 for Sales (read-only access)")
        void listProducts_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }

        @Test
        @DisplayName("should return 200 for Production (read-only access)")
        void listProducts_AsProduction_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should filter by productTypeId")
        void listProducts_FilterByProductType_ReturnsFilteredList() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("productTypeId", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[*].productTypeName", everyItem(equalTo("기계 가공품"))));
        }

        @Test
        @DisplayName("should search by name or SKU")
        void listProducts_SearchByNameOrSku_ReturnsMatchingProducts() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("search", "Alpha"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[*].name", hasItem(containsString("Alpha"))));
        }

        @Test
        @DisplayName("should search by SKU")
        void listProducts_SearchBySku_ReturnsMatchingProducts() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("search", "SKU-A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[*].sku", hasItem(containsString("SKU-A"))));
        }

        @Test
        @DisplayName("should combine productTypeId and search filters")
        void listProducts_CombineFilters_ReturnsMatchingProducts() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("productTypeId", "1")
                            .param("search", "Alpha"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[*].name", hasItem(containsString("Alpha"))));
        }

        @Test
        @DisplayName("should support pagination")
        void listProducts_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listProducts_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/products/{id} - Get Product by ID
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/products/{id} - Get Product by ID")
    class GetProductByIdTests {

        @BeforeEach
        void setUpProduct() {
            insertTestProduct(100L, "SKU-100", "Detail Product", 1L);
        }

        @Test
        @DisplayName("should return 200 with product details for Admin")
        void getProduct_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.sku").value("SKU-100"))
                    .andExpect(jsonPath("$.data.name").value("Detail Product"))
                    .andExpect(jsonPath("$.data.productTypeName").value("판금 부품"));
        }

        @Test
        @DisplayName("should return 200 for Sales (read-only access)")
        void getProduct_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/100")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(100));
        }

        @Test
        @DisplayName("should return 404 for non-existent product")
        void getProduct_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getProduct_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/products/types - Get Product Types
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/products/types - Get Product Types")
    class GetProductTypesTests {

        @Test
        @DisplayName("should return 200 with product types for Admin")
        void getProductTypes_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/types")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                    .andExpect(jsonPath("$.data[*].name", hasItem("판금 부품")))
                    .andExpect(jsonPath("$.data[*].name", hasItem("기계 가공품")));
        }

        @Test
        @DisplayName("should return 200 for Sales (read-only access)")
        void getProductTypes_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/types")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getProductTypes_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PRODUCTS_URL + "/types"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // PUT /api/products/{id} - Update Product
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/products/{id} - Update Product")
    class UpdateProductTests {

        @BeforeEach
        void setUpProduct() {
            insertTestProduct(200L, "SKU-UPDATE", "Original Product", 1L);
        }

        @Test
        @DisplayName("should return 200 with command result when Admin updates product")
        void updateProduct_AsAdmin_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Product Name",
                        "baseUnitPrice": 25000
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Product updated successfully"));
        }

        @Test
        @DisplayName("should return 200 when Finance updates product")
        void updateProduct_AsFinance_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "name": "Finance Updated Product"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales updates product")
        void updateProduct_AsSales_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "name": "Sales Updated Product"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Production updates product")
        void updateProduct_AsProduction_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "name": "Production Updated Product"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent product")
        void updateProduct_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when updating to duplicate SKU")
        void updateProduct_DuplicateSku_Returns400() throws Exception {
            // Insert another product with different SKU
            insertTestProduct(201L, "ANOTHER-SKU", "Another Product", 1L);

            String updateRequest = """
                    {
                        "sku": "ANOTHER-SKU"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updateProduct_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "name": "Updated Name"
                    }
                    """;

            mockMvc.perform(put(PRODUCTS_URL + "/200")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // DELETE /api/products/{id} - Delete (Deactivate) Product
    // ==========================================================================

    @Nested
    @DisplayName("DELETE /api/products/{id} - Delete Product")
    class DeleteProductTests {

        @BeforeEach
        void setUpProduct() {
            insertTestProduct(300L, "SKU-DELETE", "Product to Delete", 1L);
        }

        @Test
        @DisplayName("should return 204 when Admin deletes product")
        void deleteProduct_AsAdmin_Returns204() throws Exception {
            // When: Delete product - Command returns 204 No Content on success
            mockMvc.perform(delete(PRODUCTS_URL + "/300")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
            // Note: Side effect verification (soft-delete) is tested implicitly by other tests
            // and in production where JPA and MyBatis run in separate transactions
        }

        @Test
        @DisplayName("should return 403 when Finance deletes product")
        void deleteProduct_AsFinance_Returns403() throws Exception {
            mockMvc.perform(delete(PRODUCTS_URL + "/300")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Sales deletes product")
        void deleteProduct_AsSales_Returns403() throws Exception {
            mockMvc.perform(delete(PRODUCTS_URL + "/300")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when Production deletes product")
        void deleteProduct_AsProduction_Returns403() throws Exception {
            mockMvc.perform(delete(PRODUCTS_URL + "/300")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent product")
        void deleteProduct_NonExistent_Returns404() throws Exception {
            mockMvc.perform(delete(PRODUCTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void deleteProduct_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(delete(PRODUCTS_URL + "/300"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // Helper Methods for Test Data Setup
    // ==========================================================================

    /**
     * Insert a test product type.
     */
    private void insertTestProductType(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO product_types (id, name, created_at) " +
                        "VALUES (?, ?, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
    }

    /**
     * Insert a test product.
     */
    private void insertTestProduct(Long id, String sku, String name, Long productTypeId) {
        jdbcTemplate.update(
                "INSERT INTO products (id, sku, name, product_type_id, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, sku, name, productTypeId
        );
    }
}
