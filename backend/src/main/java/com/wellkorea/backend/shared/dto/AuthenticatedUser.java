package com.wellkorea.backend.shared.dto;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Custom UserDetails implementation that includes userId.
 * Extends Spring Security's User class for full compatibility with @AuthenticationPrincipal.
 *
 * <p>Used by JwtAuthenticationFilter to set authentication principal with userId embedded,
 * eliminating the need for controllers to parse tokens or query database for user ID.
 *
 * <p>Example usage in controllers:
 * <pre>
 * {@code
 * @PostMapping
 * public ResponseEntity<?> create(
 *         @AuthenticationPrincipal AuthenticatedUser user) {
 *     Long userId = user.getUserId();
 *     // ... business logic
 * }
 * }
 * </pre>
 */
public class AuthenticatedUser extends User {

    private final Long userId;

    /**
     * Create an AuthenticatedUser with user ID.
     *
     * @param username    the username (from JWT subject)
     * @param userId      the user ID (from JWT userId claim, may be null for legacy tokens)
     * @param authorities the authorities/roles granted to the user
     */
    public AuthenticatedUser(Long userId, String username, Collection<? extends GrantedAuthority> authorities) {
        super(username, "", authorities);  // Password not needed for JWT auth
        this.userId = userId;
    }

    /**
     * Get the user's database ID.
     *
     * @return the user ID, or null if token was generated before userId was added to claims
     */
    public Long getUserId() {
        return userId;
    }

    /**
     * Get the set of role names (without ROLE_ prefix if present).
     *
     * @return set of role authority strings
     */
    public Set<String> getRoleNames() {
        return getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    /**
     * Check if user has a specific role.
     *
     * @param role the role authority string (e.g., "ROLE_ADMIN")
     * @return true if user has the role
     */
    public boolean hasRole(String role) {
        return getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }

    @Override
    public String toString() {
        return "AuthenticatedUser{" +
                "userId=" + userId +
                ", username='" + getUsername() + '\'' +
                ", roles=" + getRoleNames() +
                '}';
    }
}
