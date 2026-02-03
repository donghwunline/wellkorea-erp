package com.wellkorea.backend.shared.mail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MailTokenLockService}.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("MailTokenLockService")
class MailTokenLockServiceTest {

    private static final String MAIL_REFRESH_LOCK = "mail:refresh-token";
    private static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 5;

    @Mock
    private JdbcLockRegistry lockRegistry;

    @Mock
    private Lock lock;

    private MailTokenLockService lockService;

    @BeforeEach
    void setUp() {
        lockService = new MailTokenLockService(lockRegistry);
        when(lockRegistry.obtain(MAIL_REFRESH_LOCK)).thenReturn(lock);
    }

    @Nested
    @DisplayName("executeWithLock()")
    class ExecuteWithLockTests {

        @Test
        @DisplayName("acquires and releases lock successfully")
        void acquiresAndReleasesLockSuccessfully() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            lockService.executeWithLock(() -> "result");

            InOrder inOrder = inOrder(lockRegistry, lock);
            inOrder.verify(lockRegistry).obtain(MAIL_REFRESH_LOCK);
            inOrder.verify(lock).tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            inOrder.verify(lock).unlock();
        }

        @Test
        @DisplayName("returns action result")
        void returnsActionResult() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);
            String expectedResult = "refreshed-token-12345";

            String result = lockService.executeWithLock(() -> expectedResult);

            assertThat(result).isEqualTo(expectedResult);
        }

        @Test
        @DisplayName("returns complex action result")
        void returnsComplexActionResult() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            Integer result = lockService.executeWithLock(() -> {
                int a = 10;
                int b = 20;
                return a + b;
            });

            assertThat(result).isEqualTo(30);
        }

        @Test
        @DisplayName("throws MailSendException when lock timeout")
        void throwsMailSendExceptionWhenLockTimeout() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(false);

            assertThatThrownBy(() -> lockService.executeWithLock(() -> "result"))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Another token refresh is in progress");

            verify(lock, never()).unlock();
        }

        @Test
        @DisplayName("throws MailSendException when interrupted and sets interrupt flag")
        void throwsMailSendExceptionWhenInterruptedAndSetsInterruptFlag() throws InterruptedException {
            when(lock.tryLock(anyLong(), eq(TimeUnit.SECONDS)))
                    .thenThrow(new InterruptedException("Thread interrupted"));

            assertThatThrownBy(() -> lockService.executeWithLock(() -> "result"))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Interrupted while waiting for token refresh lock")
                    .hasCauseInstanceOf(InterruptedException.class);

            // Verify the interrupt flag was set
            assertThat(Thread.currentThread().isInterrupted()).isTrue();

            // Clear the interrupt flag for subsequent tests
            Thread.interrupted();

            verify(lock, never()).unlock();
        }

        @Test
        @DisplayName("releases lock even if action throws exception")
        void releasesLockEvenIfActionThrowsException() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);
            RuntimeException actionException = new RuntimeException("Action failed");

            assertThatThrownBy(() -> lockService.executeWithLock(() -> {
                throw actionException;
            }))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Action failed");

            verify(lock).unlock();
        }

        @Test
        @DisplayName("releases lock even if action throws checked exception wrapped in RuntimeException")
        void releasesLockEvenIfActionThrowsWrappedCheckedException() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            assertThatThrownBy(() -> lockService.executeWithLock(() -> {
                throw new MailSendException("Token refresh failed", new Exception("Underlying cause"));
            }))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Token refresh failed");

            verify(lock).unlock();
        }

        @Test
        @DisplayName("action is executed only once")
        void actionIsExecutedOnlyOnce() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            int[] counter = {0};
            lockService.executeWithLock(() -> {
                counter[0]++;
                return "done";
            });

            assertThat(counter[0]).isEqualTo(1);
        }

        @Test
        @DisplayName("uses correct lock key")
        void usesCorrectLockKey() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            lockService.executeWithLock(() -> "result");

            verify(lockRegistry).obtain(MAIL_REFRESH_LOCK);
        }

        @Test
        @DisplayName("uses correct timeout")
        void usesCorrectTimeout() throws InterruptedException {
            when(lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)).thenReturn(true);

            lockService.executeWithLock(() -> "result");

            verify(lock).tryLock(5L, TimeUnit.SECONDS);
        }
    }
}
