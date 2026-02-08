package com.astba.backend.repository;

import com.astba.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRoleAndStatus(String role, String status);
    long countByStatus(String status);
    List<User> findByStatus(String status);
    List<User> findByStatusAndRole(String status, String role);
}
