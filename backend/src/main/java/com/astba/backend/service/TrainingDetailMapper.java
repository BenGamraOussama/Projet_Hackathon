package com.astba.backend.service;

import com.astba.backend.dto.LevelDetailResponse;
import com.astba.backend.dto.SessionDetailResponse;
import com.astba.backend.dto.TrainingDetailResponse;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TrainingDetailMapper {
    private final LevelRepository levelRepository;
    private final SessionRepository sessionRepository;
    private final TrainingStructureService trainingStructureService;

    public TrainingDetailMapper(LevelRepository levelRepository,
            SessionRepository sessionRepository,
            TrainingStructureService trainingStructureService) {
        this.levelRepository = levelRepository;
        this.sessionRepository = sessionRepository;
        this.trainingStructureService = trainingStructureService;
    }

    public TrainingDetailResponse buildDetail(Training training) {
        TrainingDetailResponse response = new TrainingDetailResponse();
        response.setId(training.getId());
        response.setTitle(training.getName());
        response.setDescription(training.getDescription());
        response.setStartDate(training.getStartDate());
        response.setEndDate(training.getEndDate());
        response.setStatus(training.getStatus());
        response.setCreationMode(training.getCreationMode());
        response.setStructureStatus(trainingStructureService.hasGeneratedStructure(training)
                ? TrainingStructureStatus.GENERATED
                : TrainingStructureStatus.NOT_GENERATED);

        List<Level> levels = levelRepository.findByTrainingIdOrderByLevelNumber(training.getId());
        List<Session> sessions = sessionRepository.findByTrainingId(training.getId());
        Map<Integer, Long> levelIdByNumber = levels.stream()
                .filter(level -> level.getLevelNumber() != null && level.getId() != null)
                .collect(Collectors.toMap(Level::getLevelNumber, Level::getId, (a, b) -> a));
        Map<Long, List<Session>> sessionsByLevel = sessions.stream()
                .map(session -> {
                    if (session.getLevel() != null && session.getLevel().getId() != null) {
                        return session;
                    }
                    Integer levelNumber = session.getLevelNumber();
                    Long levelId = levelNumber != null ? levelIdByNumber.get(levelNumber) : null;
                    if (levelId != null) {
                        Level level = new Level();
                        level.setId(levelId);
                        session.setLevel(level);
                    }
                    return session;
                })
                .filter(session -> session.getLevel() != null && session.getLevel().getId() != null)
                .collect(Collectors.groupingBy(session -> session.getLevel().getId()));

        for (Level level : levels) {
            List<Session> levelSessions = sessionsByLevel.getOrDefault(level.getId(), List.of());
            response.getLevels().add(toLevelDetail(level, levelSessions));
        }
        response.getLevels().sort(Comparator.comparing(LevelDetailResponse::getLevelIndex));
        return response;
    }

    public LevelDetailResponse toLevelDetail(Level level, List<Session> sessions) {
        LevelDetailResponse response = new LevelDetailResponse();
        response.setId(level.getId());
        response.setLevelIndex(level.getLevelNumber());
        response.setTitle(level.getName());
        response.setDescription(level.getDescription());
        sessions.stream()
                .sorted(Comparator.comparing(Session::getSessionNumber))
                .map(this::toSessionDetail)
                .forEach(response.getSessions()::add);
        return response;
    }

    private SessionDetailResponse toSessionDetail(Session session) {
        SessionDetailResponse detail = new SessionDetailResponse();
        detail.setId(session.getId());
        detail.setSessionIndex(session.getSessionNumber());
        detail.setTitle(session.getTitle());
        detail.setStartAt(session.getStartAt());
        detail.setDurationMin(session.getDurationMin());
        detail.setLocation(session.getLocation());
        detail.setStatus(session.getStatus());
        return detail;
    }
}
