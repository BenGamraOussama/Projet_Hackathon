package com.astba.backend.service;

import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TrainingStructureService {

    private static final int DEFAULT_LEVELS = 4;
    private static final int DEFAULT_SESSIONS_PER_LEVEL = 6;
    private static final int DEFAULT_DURATION_MIN = 120;

    private final LevelRepository levelRepository;
    private final SessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;

    public TrainingStructureService(LevelRepository levelRepository,
            SessionRepository sessionRepository,
            AttendanceRepository attendanceRepository) {
        this.levelRepository = levelRepository;
        this.sessionRepository = sessionRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public boolean isStructureLocked(Training training) {
        if (training == null || training.getId() == null) {
            return false;
        }
        List<Long> sessionIds = sessionRepository.findByTrainingId(training.getId()).stream()
                .map(Session::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (sessionIds.isEmpty()) {
            return false;
        }
        return attendanceRepository.existsBySessionIdIn(sessionIds);
    }

    public boolean hasGeneratedStructure(Training training) {
        if (training == null) {
            return false;
        }
        if (training.getStructureStatus() == TrainingStructureStatus.GENERATED) {
            return true;
        }
        if (training.getId() == null) {
            return false;
        }
        return !levelRepository.findByTrainingId(training.getId()).isEmpty()
                || !sessionRepository.findByTrainingId(training.getId()).isEmpty();
    }

    public void generateStructure(Training training, int levelsCount, int sessionsPerLevel) {
        if (training == null || training.getId() == null) {
            return;
        }
        if (training.getCreationMode() != TrainingCreationMode.AUTO) {
            return;
        }

        List<Level> existingLevels = levelRepository.findByTrainingId(training.getId());
        Map<Integer, Level> levelsByNumber = new HashMap<>();
        for (Level level : existingLevels) {
            if (level.getLevelNumber() != null) {
                levelsByNumber.put(level.getLevelNumber(), level);
            }
        }

        for (int levelNumber = 1; levelNumber <= levelsCount; levelNumber++) {
            if (!levelsByNumber.containsKey(levelNumber)) {
                Level level = new Level();
                level.setTraining(training);
                level.setLevelNumber(levelNumber);
                level.setName("Level " + levelNumber);
                level.setDescription("Level " + levelNumber + " for " + training.getName());
                Level saved = levelRepository.save(level);
                levelsByNumber.put(levelNumber, saved);
            }
        }

        List<Session> existingSessions = sessionRepository.findByTrainingId(training.getId());
        Map<Integer, Set<Integer>> sessionsByLevel = new HashMap<>();
        for (Session session : existingSessions) {
            Integer levelNumber = session.getLevelNumber();
            Integer sessionNumber = session.getSessionNumber();
            if (levelNumber == null || sessionNumber == null) {
                continue;
            }
            sessionsByLevel.computeIfAbsent(levelNumber, k -> new HashSet<>()).add(sessionNumber);
        }

        LocalDate startDate = training.getStartDate() != null ? training.getStartDate() : LocalDate.now();
        LocalDateTime startAtBase = LocalDateTime.of(startDate, LocalTime.of(9, 0));
        for (int levelNumber = 1; levelNumber <= levelsCount; levelNumber++) {
            Set<Integer> existingForLevel = sessionsByLevel.getOrDefault(levelNumber, new HashSet<>());
            Level level = levelsByNumber.get(levelNumber);
            for (int sessionNumber = 1; sessionNumber <= sessionsPerLevel; sessionNumber++) {
                if (existingForLevel.contains(sessionNumber)) {
                    continue;
                }
                Session session = new Session();
                session.setTraining(training);
                session.setLevel(level);
                session.setLevelNumber(levelNumber);
                session.setSessionNumber(sessionNumber);
                session.setTitle("Level " + levelNumber + " - Session " + sessionNumber);
                int sessionIndex = (levelNumber - 1) * sessionsPerLevel + (sessionNumber - 1);
                session.setStartAt(startAtBase.plusDays(sessionIndex * 7L));
                session.setDurationMin(DEFAULT_DURATION_MIN);
                session.setStatus("PLANNED");
                sessionRepository.save(session);
            }
        }
    }

    public int getDefaultLevelsCount() {
        return DEFAULT_LEVELS;
    }

    public int getDefaultSessionsPerLevel() {
        return DEFAULT_SESSIONS_PER_LEVEL;
    }
}
