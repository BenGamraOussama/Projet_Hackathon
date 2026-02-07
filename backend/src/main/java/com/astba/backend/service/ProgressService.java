package com.astba.backend.service;

import com.astba.backend.dto.StudentProgressResponse;
import com.astba.backend.entity.Attendance;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Student;
import com.astba.backend.entity.Training;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.SessionRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;

    public ProgressService(AttendanceRepository attendanceRepository, SessionRepository sessionRepository) {
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
    }

    public StudentProgressResponse buildProgress(Student student) {
        StudentProgressResponse response = new StudentProgressResponse();
        response.setStudentId(student.getId());
        response.setFirstName(student.getFirstName());
        response.setLastName(student.getLastName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        response.setEnrollmentDate(student.getEnrollmentDate());
        response.setStatus(student.getStatus());
        response.setCurrentLevel(student.getCurrentLevel());

        Training training = student.getTraining();
        Long trainingId = training != null ? training.getId() : null;
        response.setTrainingId(trainingId);
        response.setTrainingName(training != null ? training.getName() : null);

        List<Attendance> allAttendance = attendanceRepository.findByStudentId(student.getId());
        List<Session> sessions = trainingId != null ? sessionRepository.findByTrainingId(trainingId) : Collections.emptyList();
        Set<Long> sessionIds = sessions.stream()
                .map(Session::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Attendance> trainingAttendance = allAttendance.stream()
                .filter(record -> sessionIds.isEmpty() || sessionIds.contains(record.getSessionId()))
                .collect(Collectors.toList());

        int completedSessions = trainingAttendance.size();
        int totalSessions = trainingId == null ? 0 : (sessions.isEmpty() ? 24 : sessions.size());

        long presentOrLate = trainingAttendance.stream()
                .filter(record -> {
                    String status = record.getStatus();
                    return status != null && ("present".equalsIgnoreCase(status) || "late".equalsIgnoreCase(status));
                })
                .count();
        int attendanceRate = completedSessions > 0
                ? Math.toIntExact(Math.round((presentOrLate * 100.0) / completedSessions))
                : 0;

        int absentCount = Math.toIntExact(trainingAttendance.stream()
                .filter(record -> "absent".equalsIgnoreCase(record.getStatus()))
                .count());

        response.setCompletedSessions(completedSessions);
        response.setTotalSessions(totalSessions);
        response.setAttendanceRate(attendanceRate);
        response.setAbsentCount(absentCount);

        Set<Integer> levelNumbers = sessions.stream()
                .map(session -> session.getLevelNumber() != null
                        ? session.getLevelNumber()
                        : (session.getLevel() != null ? session.getLevel().getLevelNumber() : null))
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(TreeSet::new));
        int totalLevels = trainingId == null ? 0 : (levelNumbers.isEmpty() ? 4 : levelNumbers.size());

        int levelsCompleted = 0;
        Integer missingLevel = null;
        int missingSessions = Math.max(totalSessions - completedSessions, 0);

        if (!sessions.isEmpty()) {
            Map<Integer, List<Session>> sessionsByLevel = sessions.stream()
                    .map(session -> {
                        if (session.getLevelNumber() == null && session.getLevel() != null) {
                            session.setLevelNumber(session.getLevel().getLevelNumber());
                        }
                        return session;
                    })
                    .filter(session -> session.getLevelNumber() != null)
                    .collect(Collectors.groupingBy(Session::getLevelNumber));
            Map<Long, Attendance> attendanceBySession = trainingAttendance.stream()
                    .filter(record -> record.getSessionId() != null)
                    .collect(Collectors.toMap(Attendance::getSessionId, record -> record, (a, b) -> a));

            List<Integer> orderedLevels = new ArrayList<>(sessionsByLevel.keySet());
            orderedLevels.sort(Integer::compareTo);
            for (Integer level : orderedLevels) {
                List<Session> levelSessions = sessionsByLevel.getOrDefault(level, List.of());
                long completedForLevel = levelSessions.stream()
                        .filter(session -> attendanceBySession.containsKey(session.getId()))
                        .count();
                if (completedForLevel >= levelSessions.size()) {
                    levelsCompleted++;
                } else if (missingLevel == null) {
                    missingLevel = level;
                    missingSessions = Math.max((int) (levelSessions.size() - completedForLevel), 0);
                }
            }
        } else if (totalSessions > 0) {
            int sessionsPerLevel = totalLevels == 0 ? 6 : Math.max(1, totalSessions / totalLevels);
            levelsCompleted = Math.min(totalLevels, completedSessions / sessionsPerLevel);
            if (levelsCompleted < totalLevels) {
                missingLevel = levelsCompleted + 1;
                missingSessions = Math.max(sessionsPerLevel - (completedSessions - (levelsCompleted * sessionsPerLevel)), 0);
            }
        }

        response.setTotalLevels(totalLevels);
        response.setLevelsCompleted(levelsCompleted);
        response.setLevelsRemaining(Math.max(totalLevels - levelsCompleted, 0));
        response.setSessionsRemaining(Math.max(totalSessions - completedSessions, 0));
        response.setMissingSessions(missingSessions);
        response.setMissingLevel(missingLevel);

        boolean eligible = totalSessions > 0 && completedSessions >= totalSessions && attendanceRate >= 80;
        response.setEligibleForCertification(eligible);
        response.setBlockReason(buildBlockReason(trainingId, totalSessions, completedSessions, attendanceRate, missingSessions, missingLevel));

        return response;
    }

    private String buildBlockReason(Long trainingId, int totalSessions, int completedSessions, int attendanceRate,
            int missingSessions, Integer missingLevel) {
        if (trainingId == null) {
            return "No training assigned";
        }
        if (completedSessions < totalSessions) {
            if (missingLevel != null && missingSessions > 0) {
                return "Missing " + missingSessions + " session(s) in level " + missingLevel;
            }
            return "Missing " + (totalSessions - completedSessions) + " session(s)";
        }
        if (attendanceRate < 80) {
            return "Attendance rate below 80% (" + attendanceRate + "%)";
        }
        return "";
    }
}
