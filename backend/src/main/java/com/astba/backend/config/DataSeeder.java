package com.astba.backend.config;

import com.astba.backend.entity.User;
import com.astba.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setEmail("admin@astba.tn");
            admin.setPassword(passwordEncoder.encode("demo123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setRole("ADMIN");
            userRepository.save(admin);

            User formateur = new User();
            formateur.setEmail("formateur@astba.tn");
            formateur.setPassword(passwordEncoder.encode("demo123"));
            formateur.setFirstName("Formateur");
            formateur.setLastName("Demo");
            formateur.setRole("INSTRUCTOR");
            userRepository.save(formateur);

            // Create Trainings
            com.astba.backend.entity.Training t1 = new com.astba.backend.entity.Training();
            t1.setName("Advanced Web Development");
            t1.setDescription("Comprehensive training covering modern web development.");
            t1.setStartDate(java.time.LocalDate.parse("2024-01-15"));
            t1.setEndDate(java.time.LocalDate.parse("2024-06-30"));
            t1.setStatus("active");
            com.astba.backend.repository.TrainingRepository trainingRepository = applicationContext
                    .getBean(com.astba.backend.repository.TrainingRepository.class);
            trainingRepository.save(t1);

            // Create Students
            com.astba.backend.entity.Student s1 = new com.astba.backend.entity.Student();
            s1.setFirstName("Emma");
            s1.setLastName("Johnson");
            s1.setEmail("emma.johnson@email.com");
            s1.setPhone("+1 555-0101");
            s1.setEnrollmentDate(java.time.LocalDate.parse("2024-01-15"));
            s1.setStatus("active");
            s1.setCurrentLevel(2);
            s1.setTraining(t1);
            com.astba.backend.repository.StudentRepository studentRepository = applicationContext
                    .getBean(com.astba.backend.repository.StudentRepository.class);
            studentRepository.save(s1);
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.context.ApplicationContext applicationContext;
}
