package com.astba.backend.repository;

import com.astba.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRecipientId(String recipientId);

    List<Message> findBySenderId(String senderId);
}
