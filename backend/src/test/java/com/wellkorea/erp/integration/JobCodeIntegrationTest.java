package com.wellkorea.erp.integration;

import com.wellkorea.erp.api.jobcode.dto.CreateJobCodeRequest;
import com.wellkorea.erp.api.jobcode.dto.UpdateJobCodeRequest;
import com.wellkorea.erp.domain.customer.Customer;
import com.wellkorea.erp.domain.customer.CustomerRepository;
import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.jobcode.JobCodeRepository;
import com.wellkorea.erp.domain.jobcode.JobCodeStatus;
import com.wellkorea.erp.domain.role.Role;
import com.wellkorea.erp.domain.role.RoleRepository;
import com.wellkorea.erp.domain.user.User;
import com.wellkorea.erp.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@DisplayName("JobCode Integration Tests")
class JobCodeIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JobCodeRepository jobCodeRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Customer testCustomer;
    private User testUser;
    private String authToken;

    @BeforeEach
    void setUp() {
        // Clean database
        jobCodeRepository.deleteAll();
        userRepository.deleteAll();
        customerRepository.deleteAll();

        // Create test customer
        testCustomer = new Customer();
        testCustomer.setName("Test Customer Ltd.");
        testCustomer.setCompanyRegistrationNumber("123-45-67890");
        testCustomer.setBusinessType("Manufacturing");
        testCustomer.setAddress("123 Test St");
        testCustomer.setContactPerson("John Doe");
        testCustomer.setContactPhone("010-1234-5678");
        testCustomer.setContactEmail("test@customer.com");
        testCustomer = customerRepository.save(testCustomer);

        // Create or get ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ADMIN");
                    role.setDescription("Administrator");
                    return roleRepository.save(role);
                });

        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password"));
        testUser.setRoles(Set.of(adminRole));
        testUser = userRepository.save(testUser);

        // Login to get auth token
        authToken = loginAndGetToken();
    }

    private String loginAndGetToken() {
        // For simplicity, we'll skip the actual login flow
        // In a real test, you'd call /api/v1/auth/login and extract the token
        // For now, we'll just return a mock value or use @WithMockUser in tests
        return "Bearer mock-token";
    }

    @Test
    @DisplayName("Should create, retrieve, and update JobCode successfully")
    void testJobCodeCreateRetrieveUpdate() {
        // Create JobCode
        CreateJobCodeRequest createRequest = CreateJobCodeRequest.builder()
                .projectName("Integration Test Project")
                .customerId(testCustomer.getId())
                .ownerId(testUser.getId())
                .dueDate(LocalDate.now().plusDays(30))
                .description("This is a test project")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", authToken);
        HttpEntity<CreateJobCodeRequest> createEntity = new HttpEntity<>(createRequest, headers);

        ResponseEntity<JobCode> createResponse = restTemplate.exchange(
                "/api/v1/jobcodes",
                HttpMethod.POST,
                createEntity,
                JobCode.class
        );

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JobCode createdJobCode = createResponse.getBody();
        assertThat(createdJobCode).isNotNull();
        assertThat(createdJobCode.getJobcode()).isNotNull();
        assertThat(createdJobCode.getProjectName()).isEqualTo("Integration Test Project");
        assertThat(createdJobCode.getStatus()).isEqualTo(JobCodeStatus.DRAFT);

        // Retrieve JobCode
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);
        ResponseEntity<JobCode> getResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + createdJobCode.getId(),
                HttpMethod.GET,
                getEntity,
                JobCode.class
        );

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JobCode retrievedJobCode = getResponse.getBody();
        assertThat(retrievedJobCode).isNotNull();
        assertThat(retrievedJobCode.getId()).isEqualTo(createdJobCode.getId());
        assertThat(retrievedJobCode.getProjectName()).isEqualTo("Integration Test Project");

        // Update JobCode
        UpdateJobCodeRequest updateRequest = UpdateJobCodeRequest.builder()
                .projectName("Updated Project Name")
                .description("Updated description")
                .status(JobCodeStatus.ACTIVE)
                .build();

        HttpEntity<UpdateJobCodeRequest> updateEntity = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<JobCode> updateResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + createdJobCode.getId(),
                HttpMethod.PUT,
                updateEntity,
                JobCode.class
        );

        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JobCode updatedJobCode = updateResponse.getBody();
        assertThat(updatedJobCode).isNotNull();
        assertThat(updatedJobCode.getProjectName()).isEqualTo("Updated Project Name");
        assertThat(updatedJobCode.getStatus()).isEqualTo(JobCodeStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should generate unique JobCode sequences even with concurrent requests")
    void testJobCodeSequenceUniqueness() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(() -> {
                try {
                    CreateJobCodeRequest request = CreateJobCodeRequest.builder()
                            .projectName("Concurrent Test Project")
                            .customerId(testCustomer.getId())
                            .ownerId(testUser.getId())
                            .dueDate(LocalDate.now().plusDays(30))
                            .build();

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    headers.set("Authorization", authToken);
                    HttpEntity<CreateJobCodeRequest> entity = new HttpEntity<>(request, headers);

                    ResponseEntity<JobCode> response = restTemplate.exchange(
                            "/api/v1/jobcodes",
                            HttpMethod.POST,
                            entity,
                            JobCode.class
                    );

                    if (response.getStatusCode() == HttpStatus.CREATED) {
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        // Verify all JobCodes were created
        assertThat(successCount.get()).isEqualTo(numberOfThreads);

        // Verify all JobCode codes are unique
        List<JobCode> allJobCodes = jobCodeRepository.findAll();
        long uniqueCodesCount = allJobCodes.stream()
                .map(JobCode::getJobcode)
                .distinct()
                .count();

        assertThat(uniqueCodesCount).isEqualTo(allJobCodes.size());
    }

    @Test
    @DisplayName("Should enforce valid status transitions")
    void testJobCodeStatusTransitions() {
        // Create a JobCode in DRAFT status
        JobCode jobCode = new JobCode();
        jobCode.setJobcode("WK2K25-TEST-001");
        jobCode.setProjectName("Status Transition Test");
        jobCode.setCustomer(testCustomer);
        jobCode.setInternalOwner(testUser);
        jobCode.setRequestedDueDate(LocalDate.now().plusDays(30));
        jobCode.setStatus(JobCodeStatus.DRAFT);
        jobCode = jobCodeRepository.save(jobCode);

        // Transition DRAFT -> ACTIVE (should succeed)
        UpdateJobCodeRequest activateRequest = UpdateJobCodeRequest.builder()
                .status(JobCodeStatus.ACTIVE)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", authToken);
        HttpEntity<UpdateJobCodeRequest> activateEntity = new HttpEntity<>(activateRequest, headers);

        ResponseEntity<JobCode> activateResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + jobCode.getId(),
                HttpMethod.PUT,
                activateEntity,
                JobCode.class
        );

        assertThat(activateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activateResponse.getBody().getStatus()).isEqualTo(JobCodeStatus.ACTIVE);

        // Transition ACTIVE -> IN_PROGRESS (should succeed)
        UpdateJobCodeRequest inProgressRequest = UpdateJobCodeRequest.builder()
                .status(JobCodeStatus.IN_PROGRESS)
                .build();

        HttpEntity<UpdateJobCodeRequest> inProgressEntity = new HttpEntity<>(inProgressRequest, headers);
        ResponseEntity<JobCode> inProgressResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + jobCode.getId(),
                HttpMethod.PUT,
                inProgressEntity,
                JobCode.class
        );

        assertThat(inProgressResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(inProgressResponse.getBody().getStatus()).isEqualTo(JobCodeStatus.IN_PROGRESS);

        // Transition IN_PROGRESS -> COMPLETED (should succeed)
        UpdateJobCodeRequest completedRequest = UpdateJobCodeRequest.builder()
                .status(JobCodeStatus.COMPLETED)
                .build();

        HttpEntity<UpdateJobCodeRequest> completedEntity = new HttpEntity<>(completedRequest, headers);
        ResponseEntity<JobCode> completedResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + jobCode.getId(),
                HttpMethod.PUT,
                completedEntity,
                JobCode.class
        );

        assertThat(completedResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(completedResponse.getBody().getStatus()).isEqualTo(JobCodeStatus.COMPLETED);

        // Attempt to transition COMPLETED -> DRAFT (should fail)
        UpdateJobCodeRequest invalidRequest = UpdateJobCodeRequest.builder()
                .status(JobCodeStatus.DRAFT)
                .build();

        HttpEntity<UpdateJobCodeRequest> invalidEntity = new HttpEntity<>(invalidRequest, headers);
        ResponseEntity<String> invalidResponse = restTemplate.exchange(
                "/api/v1/jobcodes/" + jobCode.getId(),
                HttpMethod.PUT,
                invalidEntity,
                String.class
        );

        assertThat(invalidResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
