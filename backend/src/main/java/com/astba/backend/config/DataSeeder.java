package com.astba.backend.config;

import com.astba.backend.entity.Student;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.User;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.repository.UserRepository;
import com.astba.backend.service.EnrollmentService;
import com.astba.backend.service.TrainingStructureService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import java.util.List;

@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TrainingRepository trainingRepository;
    private final StudentRepository studentRepository;
    private final TrainingStructureService trainingStructureService;
    private final PasswordEncoder passwordEncoder;
    private final EnrollmentService enrollmentService;

    public DataSeeder(UserRepository userRepository,
            TrainingRepository trainingRepository,
            StudentRepository studentRepository,
            TrainingStructureService trainingStructureService,
            PasswordEncoder passwordEncoder,
            EnrollmentService enrollmentService) {
        this.userRepository = userRepository;
        this.trainingRepository = trainingRepository;
        this.studentRepository = studentRepository;
        this.trainingStructureService = trainingStructureService;
        this.passwordEncoder = passwordEncoder;
        this.enrollmentService = enrollmentService;
    }

    @Override
    public void run(String... args) throws Exception {
        upsertUser("admin@astba.tn", "Admin", "User", "ADMIN");
        upsertUser("formateur@astba.tn", "Formateur", "Demo", "FORMATEUR");
        upsertUser("responsable@astba.tn", "Responsable", "Formation", "RESPONSABLE");

        if (trainingRepository.count() == 0) {
            Training t1 = new Training();
            t1.setName("Advanced Web Development");
            t1.setDescription("Comprehensive training covering modern web development.");
            t1.setStartDate(java.time.LocalDate.parse("2024-01-15"));
            t1.setEndDate(java.time.LocalDate.parse("2024-06-30"));
            t1.setStatus("active");
            t1.setCreationMode(TrainingCreationMode.AUTO);
            t1.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
            trainingRepository.save(t1);
        }

        List<Training> trainings = trainingRepository.findAll();
        for (Training training : trainings) {
            if (training.getCreationMode() == TrainingCreationMode.AUTO
                    && !trainingStructureService.hasGeneratedStructure(training)) {
                trainingStructureService.generateStructure(training,
                        trainingStructureService.getDefaultLevelsCount(),
                        trainingStructureService.getDefaultSessionsPerLevel());
                training.setStructureStatus(TrainingStructureStatus.GENERATED);
                trainingRepository.save(training);
            }
        }

        if (studentRepository.count() == 0 && !trainings.isEmpty()) {
            Training t1 = trainings.get(0);
            Student s1 = new Student();
            s1.setFirstName("Emma");
            s1.setLastName("Johnson");
            s1.setEmail("emma.johnson@email.com");
            s1.setPhone("+1 555-0101");
            s1.setEnrollmentDate(java.time.LocalDate.parse("2024-01-15"));
            s1.setStatus("active");
            s1.setCurrentLevel(1);
            s1.setTraining(t1);
            Student saved = studentRepository.save(s1);
            enrollmentService.ensureActiveEnrollment(saved, t1);
        }
    }

    private void upsertUser(String email, String firstName, String lastName, String role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        if (user.getPassword() == null || user.getPassword().isBlank()
                || !passwordEncoder.matches("demo123", user.getPassword())) {
            user.setPassword(passwordEncoder.encode("demo123"));
        }
        userRepository.save(user);
    }
}
