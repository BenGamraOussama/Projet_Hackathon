package com.astba.backend;

import com.astba.backend.entity.Attendance;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Student;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDate;
import java.util.Map;
import java.util.Objects;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TrainingStructureControllerTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TrainingRepository trainingRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void cannotGenerateStructureInManualMode() throws Exception {
        Training training = new Training();
        training.setName("Manual Training");
        training.setCreationMode(TrainingCreationMode.MANUAL);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training saved = trainingRepository.save(training);

        mockMvc.perform(post("/api/trainings/{id}/generate-structure", saved.getId()))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void cannotCreateManualLevelInAutoMode() throws Exception {
        Training training = new Training();
        training.setName("Auto Training");
        training.setCreationMode(TrainingCreationMode.AUTO);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training saved = trainingRepository.save(training);
        long trainingId = Objects.requireNonNull(saved.getId(), "trainingId");

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of("levelIndex", 1)), "payload");
        mockMvc.perform(post("/api/trainings/{id}/levels", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void cannotCreateManualSessionInAutoMode() throws Exception {
        Training training = new Training();
        training.setName("Auto Training");
        training.setCreationMode(TrainingCreationMode.AUTO);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training savedTraining = trainingRepository.save(training);

        Level level = new Level();
        level.setTraining(savedTraining);
        level.setLevelNumber(1);
        level.setName("Level 1");
        Level savedLevel = levelRepository.save(level);
        long levelId = Objects.requireNonNull(savedLevel.getId(), "levelId");

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of("sessionIndex", 1)), "payload");
        mockMvc.perform(post("/api/levels/{id}/sessions", levelId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void structureLockedWhenAttendanceExists() throws Exception {
        Training training = new Training();
        training.setName("Locked Training");
        training.setCreationMode(TrainingCreationMode.MANUAL);
        training.setStructureStatus(TrainingStructureStatus.GENERATED);
        Training savedTraining = trainingRepository.save(training);

        Level level = new Level();
        level.setTraining(savedTraining);
        level.setLevelNumber(1);
        level.setName("Level 1");
        Level savedLevel = levelRepository.save(level);

        Session session = new Session();
        session.setTraining(savedTraining);
        session.setLevel(savedLevel);
        session.setLevelNumber(1);
        session.setSessionNumber(1);
        session.setTitle("Session 1");
        Session savedSession = sessionRepository.save(session);

        Student student = new Student();
        student.setFirstName("Test");
        student.setLastName("Student");
        student.setEmail("student@example.com");
        student.setEnrollmentDate(LocalDate.now());
        student.setStatus("active");
        student.setCurrentLevel(1);
        student.setTraining(savedTraining);
        Student savedStudent = studentRepository.save(student);

        Attendance attendance = new Attendance();
        attendance.setStudent(savedStudent);
        attendance.setSessionId(savedSession.getId());
        attendance.setDate(LocalDate.now());
        attendance.setStatus("present");
        attendanceRepository.save(attendance);

        long trainingId = Objects.requireNonNull(savedTraining.getId(), "trainingId");
        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of("levelIndex", 2)), "payload");
        mockMvc.perform(post("/api/trainings/{id}/levels", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void uniqueConstraintReturnsConflict() throws Exception {
        Training training = new Training();
        training.setName("Manual Training");
        training.setCreationMode(TrainingCreationMode.MANUAL);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training savedTraining = trainingRepository.save(training);

        Level level = new Level();
        level.setTraining(savedTraining);
        level.setLevelNumber(1);
        level.setName("Level 1");
        levelRepository.save(level);

        long trainingId = Objects.requireNonNull(savedTraining.getId(), "trainingId");
        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of("levelIndex", 1)), "payload");
        mockMvc.perform(post("/api/trainings/{id}/levels", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }
}
