package com.wellkorea.backend.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Test configuration that provides MockMailSender for integration tests.
 * This bean takes priority over the production mail sender beans.
 */
@TestConfiguration
public class TestMailConfig {

    private static final Logger log = LoggerFactory.getLogger(TestMailConfig.class);

    @Bean
    @Primary
    public MailSender mockMailSender() {
        log.info("Configuring MockMailSender for tests");
        return new MockMailSender();
    }
}
