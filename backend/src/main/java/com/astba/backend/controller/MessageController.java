package com.astba.backend.controller;

import com.astba.backend.entity.Message;
import com.astba.backend.repository.MessageRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }

    @PostMapping
    public Message sendMessage(@RequestBody Message message) {
        message.setTimestamp(LocalDateTime.now());
        message.setRead(false);
        return messageRepository.save(message);
    }
}
