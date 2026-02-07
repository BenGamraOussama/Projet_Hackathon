package com.astba.backend.repository;

import com.astba.backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByTrainingId(Long trainingId);
    List<Session> findByTrainingIdAndLevelNumber(Long trainingId, Integer levelNumber);
    List<Session> findByLevelId(Long levelId);
}
