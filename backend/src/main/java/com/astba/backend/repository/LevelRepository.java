package com.astba.backend.repository;

import com.astba.backend.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LevelRepository extends JpaRepository<Level, Long> {
    List<Level> findByTrainingId(Long trainingId);
    Optional<Level> findByTrainingIdAndLevelNumber(Long trainingId, Integer levelNumber);
    List<Level> findByTrainingIdOrderByLevelNumber(Long trainingId);
}
