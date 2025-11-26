package com.wellkorea.erp.security.jwt;

import com.wellkorea.erp.domain.role.Role;
import com.wellkorea.erp.domain.user.User;
import com.wellkorea.erp.domain.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Custom UserDetailsService for loading user by username or ID
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to parse as UUID first (for JWT token validation)
        try {
            UUID userId = UUID.fromString(username);
            return loadUserById(userId);
        } catch (IllegalArgumentException e) {
            // Not a UUID, treat as username
            User user = userRepository.findByUsernameWithRoles(username)
                    .orElseThrow(() ->
                            new UsernameNotFoundException("User not found with username: " + username));
            return createUserPrincipal(user);
        }
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with id: " + id));
        return createUserPrincipal(user);
    }

    private UserPrincipal createUserPrincipal(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return UserPrincipal.create(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                roles
        );
    }
}
