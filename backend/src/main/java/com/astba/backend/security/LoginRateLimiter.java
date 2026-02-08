package com.astba.backend.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 10 * 60 * 1000L;

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null) return false;
        if (attempt.blockedUntil > Instant.now().toEpochMilli()) return true;
        if (attempt.windowStart + WINDOW_MS < Instant.now().toEpochMilli()) {
            attempts.remove(key);
            return false;
        }
        return attempt.count >= MAX_ATTEMPTS;
    }

    public void recordFailure(String key) {
        long now = Instant.now().toEpochMilli();
        Attempt attempt = attempts.getOrDefault(key, new Attempt(now, 0, 0));
        if (attempt.windowStart + WINDOW_MS < now) {
            attempt = new Attempt(now, 0, 0);
        }
        attempt.count++;
        if (attempt.count >= MAX_ATTEMPTS) {
            attempt.blockedUntil = now + WINDOW_MS;
        }
        attempts.put(key, attempt);
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private static class Attempt {
        long windowStart;
        int count;
        long blockedUntil;

        Attempt(long windowStart, int count, long blockedUntil) {
            this.windowStart = windowStart;
            this.count = count;
            this.blockedUntil = blockedUntil;
        }
    }
}
