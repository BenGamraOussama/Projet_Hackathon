package com.astba.backend.controller;

import com.astba.backend.entity.Student;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;

    public StudentController(StudentRepository studentRepository, TrainingRepository trainingRepository) {
        this.studentRepository = studentRepository;
        this.trainingRepository = trainingRepository;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        student.setEnrollmentDate(LocalDate.now());
        student.setStatus("active");
        student.setCurrentLevel(1);

        if (student.getTraining() != null && student.getTraining().getId() != null) {
            trainingRepository.findById(student.getTraining().getId())
                    .ifPresent(student::setTraining);
        }

        return studentRepository.save(student);
    }
}
