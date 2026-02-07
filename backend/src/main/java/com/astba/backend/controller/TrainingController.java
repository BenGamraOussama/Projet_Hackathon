package com.astba.backend.controller;

import com.astba.backend.entity.Training;
import com.astba.backend.repository.TrainingRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/trainings")
public class TrainingController {

    private final TrainingRepository trainingRepository;

    public TrainingController(TrainingRepository trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    @GetMapping
    public List<Training> getAllTrainings() {
        return trainingRepository.findAll();
    }
}
