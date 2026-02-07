package com.astba.backend.service;

import com.astba.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiRateLimiter {
    private static final int MAX_REQUESTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private final Map<String, Deque<Instant>> requestsByUser = new ConcurrentHashMap<>();

    public void assertAllowed(String userKey) {
        Deque<Instant> deque = requestsByUser.computeIfAbsent(userKey, key -> new ArrayDeque<>());
        Instant now = Instant.now();
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(now.minus(WINDOW))) {
                deque.pollFirst();
            }
            if (deque.size() >= MAX_REQUESTS) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMIT",
                        "Too many AI requests. Please wait and retry.");
            }
            deque.addLast(now);
        }
    }
}
