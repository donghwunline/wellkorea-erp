 # Keycloak Migration Guide
 
 **Status**: Planned for future implementation
 **Current**: Spring Security + JWT (MVP)
 **Target**: Keycloak + OAuth2 Resource Server
 
 ---
 
 ## Current Architecture (MVP)
 
 ### Authentication Flow
 ```
 User → Login Request → Backend AuthenticationController
   → Spring Security Authentication
   → Generate JWT (JJWT library)
   → Return JWT to client
   → Client sends JWT in Authorization header
   → Backend validates JWT
   → Extract roles and user info
 ```
 
 ### Key Components
 - **UserDetailsService**: Loads users from PostgreSQL
 - **JWT Generation**: Custom service using io.jsonwebtoken:jjwt
 - **JWT Validation**: Custom JwtAuthenticationFilter
 - **Role-Based Access Control**: Spring Security @PreAuthorize annotations
 - **User Storage**: PostgreSQL (users, roles tables)
 
 ---
 
 ## Target Architecture (Keycloak)
 
 ### Authentication Flow
 ```
 User → Login Request → Keycloak
   → Keycloak authenticates
   → Keycloak generates JWT
   → Return JWT to client
   → Client sends JWT in Authorization header
   → Backend validates JWT signature (Keycloak public key)
   → Extract roles from JWT claims
 ```
 
 ### Key Components (After Migration)
 - **OAuth2 Resource Server**: Spring Security OAuth2
 - **JWT Validation**: Spring Security (validates against Keycloak)
 - **Role Mapping**: Keycloak realm roles → Spring Security authorities
 - **User Storage**: Keycloak (users, roles) + PostgreSQL (application data)
 - **RBAC**: Same @PreAuthorize annotations (no code changes)
 
 ---
 
 ## Migration Steps
 
 ### Phase 1: Keycloak Setup (Infrastructure)
 
 1. **Add Keycloak to docker-compose.yml**
    ```yaml
    keycloak:
      image: quay.io/keycloak/keycloak:23.0
      environment:
        KEYCLOAK_ADMIN: admin
        KEYCLOAK_ADMIN_PASSWORD: admin
        KC_DB: postgres
        KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
        KC_DB_USERNAME: keycloak
        KC_DB_PASSWORD: keycloak
      ports:
        - "8080:8080"
      command: start-dev
    ```
 
 2. **Create Keycloak realm configuration**
    - Realm: `wellkorea-erp`
    - Clients: `erp-backend`, `erp-frontend`
    - Roles: `ADMIN`, `FINANCE`, `PRODUCTION`, `SALES`
 
 3. **Import existing users from PostgreSQL to Keycloak**
    - Export users via script
    - Import to Keycloak realm
    - Migrate role assignments
 
 ### Phase 2: Backend Changes (Code)
 
 1. **Update build.gradle dependencies**
    ```gradle
    // Uncomment OAuth2 Resource Server
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
 
    // Remove custom JWT dependencies (keep for backward compatibility initially)
    // implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    // runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.3'
    // runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.3'
    ```
 
 2. **Update application.properties**
    ```properties
    # Keycloak OAuth2 configuration
    spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/wellkorea-erp
    spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/wellkorea-erp/protocol/openid-connect/certs
    ```
 
 3. **Replace SecurityConfig.java**
    - Remove custom JWT filter chain
    - Configure OAuth2 resource server
    - Map Keycloak roles to Spring Security authorities
 
    ```java
    @Configuration
    @EnableWebSecurity
    @EnableMethodSecurity
    public class SecurityConfig {
 
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http
                .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                    )
                )
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .anyRequest().authenticated()
                );
            return http.build();
        }
 
        @Bean
        public JwtAuthenticationConverter jwtAuthenticationConverter() {
            JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
            grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
            grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
 
            JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
            jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
            return jwtAuthenticationConverter;
        }
    }
    ```
 
 4. **Remove/deprecate custom authentication controllers**
    - AuthenticationController (login/logout) → handled by Keycloak
    - Keep UserController for user management (if needed)
 
 ### Phase 3: Frontend Changes
 
 1. **Update authentication flow**
    - Replace custom login with Keycloak redirect
    - Use Authorization Code Flow with PKCE
    - Store Keycloak JWT instead of custom JWT
 
 2. **Update API client**
    ```typescript
    // Use Keycloak JS library
    import Keycloak from 'keycloak-js';
 
    const keycloak = new Keycloak({
      url: 'http://localhost:8080',
      realm: 'wellkorea-erp',
      clientId: 'erp-frontend'
    });
 
    keycloak.init({ onLoad: 'login-required' });
    ```
 
 ### Phase 4: Data Migration
 
 1. **Sync users from PostgreSQL to Keycloak**
    - One-time migration script
    - Map roles: database roles → Keycloak realm roles
 
 2. **Maintain dual storage temporarily**
    - Users in Keycloak (authentication)
    - User metadata in PostgreSQL (application data)
    - Foreign key: `user_id` remains same
 
 3. **Update user management UI**
    - Create users in Keycloak via Admin API
    - Store metadata in PostgreSQL
    - Keep audit logs in PostgreSQL
 
 ---
 
 ## Backward Compatibility Strategy
 
 ### Dual-Mode Operation (Transition Period)
 
 Support both JWT types during migration:
 
 ```java
 @Configuration
 public class DualAuthenticationConfig {
 
     @Bean
     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
         http
             .addFilterBefore(customJwtFilter(), UsernamePasswordAuthenticationFilter.class) // Legacy
             .oauth2ResourceServer(oauth2 -> oauth2.jwt()) // Keycloak
             .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
         return http.build();
     }
 }
 ```
 
 ### Feature Flags
 
 Use feature flags to control authentication mode:
 
 ```properties
 # application.properties
 auth.mode=keycloak  # or 'jwt' for legacy
 ```
 
 ---
 
 ## Testing Strategy
 
 ### Unit Tests
 - No changes needed for business logic
 - Update security test mocks to use OAuth2 tokens
 
 ### Integration Tests
 - Use Testcontainers Keycloak module
 - Mock Keycloak token validation
 
 ### E2E Tests
 - Test with real Keycloak instance
 - Verify role-based access control
 
 ---
 
 ## Rollback Plan
 
 1. **Keep custom JWT code temporarily**
 2. **Feature flag to switch between modes**
 3. **Monitor authentication failures**
 4. **Rollback by reverting configuration**
 
 ---
 
 ## Benefits of Keycloak Migration
 
 1. **Single Sign-On (SSO)**: Multiple apps can share authentication
 2. **Production-grade security**: Industry-standard OAuth2/OIDC
 3. **User management UI**: Built-in admin console
 4. **Identity federation**: LDAP, Active Directory, Social login
 5. **Token management**: Refresh tokens, revocation
 6. **Audit logging**: Built-in security event logging
 
 ---
 
 ## Timeline Estimate
 
 - **Phase 1** (Infrastructure): 1-2 days
 - **Phase 2** (Backend): 2-3 days
 - **Phase 3** (Frontend): 1-2 days
 - **Phase 4** (Data Migration): 1 day
 - **Testing & Validation**: 2-3 days
 
 **Total**: ~7-11 days
 
 ---
 
 ## Checklist
 
 - [ ] Keycloak container running
 - [ ] Realm configured with roles
 - [ ] Backend OAuth2 resource server working
 - [ ] Frontend using Keycloak login
 - [ ] Users migrated to Keycloak
 - [ ] All E2E tests passing
 - [ ] Performance validated
 - [ ] Documentation updated
 - [ ] Team trained on Keycloak
 
 ---
 
 ## References
 
 - [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
 - [Keycloak Documentation](https://www.keycloak.org/documentation)
 - [Keycloak Spring Boot Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_spring_boot_adapter)