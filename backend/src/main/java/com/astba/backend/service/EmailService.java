package com.astba.backend.service;

import com.astba.backend.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:no-reply@astba.tn}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendLoginEmail(User user, String plainPassword) {
        if (mailHost == null || mailHost.isBlank()) {
            logger.warn("SMTP host not configured; skipping email for {}", user.getEmail());
            throw new IllegalStateException("SMTP_NOT_CONFIGURED");
        }
        verifySmtpConnection();
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(user.getEmail());
            message.setSubject("Vos identifiants ASTBA");
            message.setText(buildLoginMessage(user, plainPassword));
            mailSender.send(message);
        } catch (Exception ex) {
            logger.warn("Failed to send login email to {}", user.getEmail(), ex);
            throw new IllegalStateException("SMTP_SEND_FAILED: " + ex.getMessage());
        }
    }

    private String buildLoginMessage(User user, String plainPassword) {
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        if (fullName.isBlank()) {
            fullName = "Bonjour";
        } else {
            fullName = "Bonjour " + fullName;
        }
        return fullName + ",\n\n"
                + "Votre compte ASTBA a été créé.\n\n"
                + "Email: " + user.getEmail() + "\n"
                + "Mot de passe: " + plainPassword + "\n\n"
                + "Connectez-vous depuis l'application pour accéder à votre espace.\n"
                + "Merci.";
    }

    private void verifySmtpConnection() {
        if (mailSender instanceof JavaMailSenderImpl sender) {
            try {
                sender.testConnection();
            } catch (Exception ex) {
                logger.warn("SMTP connection test failed", ex);
                throw new IllegalStateException("SMTP_CONNECTION_FAILED: " + ex.getMessage());
            }
        }
    }
}
