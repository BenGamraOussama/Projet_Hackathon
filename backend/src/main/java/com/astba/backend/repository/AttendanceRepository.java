package com.astba.backend.repository;

import com.astba.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByStudentTrainingId(Long trainingId);
    List<Attendance> findByStudentIdAndSessionId(Long studentId, Long sessionId);
    List<Attendance> findBySessionId(Long sessionId);
    boolean existsBySessionIdIn(List<Long> sessionIds);
}
