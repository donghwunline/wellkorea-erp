package com.wellkorea.backend.auth.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Configuration for Spring MVC.
 * Registers custom argument resolvers.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CurrentTokenArgumentResolver currentTokenArgumentResolver;

    public WebMvcConfig(CurrentTokenArgumentResolver currentTokenArgumentResolver) {
        this.currentTokenArgumentResolver = currentTokenArgumentResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentTokenArgumentResolver);
    }
}
