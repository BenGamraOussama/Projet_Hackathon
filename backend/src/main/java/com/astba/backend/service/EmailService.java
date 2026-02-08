package com.astba.backend.service;

import com.astba.backend.entity.User;
import com.astba.backend.entity.Student;
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

    public void sendPasswordResetEmail(User user, String resetLink) {
        if (mailHost == null || mailHost.isBlank()) {
            logger.warn("SMTP host not configured; skipping password reset email for {}", user.getEmail());
            throw new IllegalStateException("SMTP_NOT_CONFIGURED");
        }
        verifySmtpConnection();
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(user.getEmail());
            message.setSubject("Réinitialisation du mot de passe ASTBA");
            message.setText(buildResetMessage(user, resetLink));
            mailSender.send(message);
        } catch (Exception ex) {
            logger.warn("Failed to send reset email to {}", user.getEmail(), ex);
            throw new IllegalStateException("SMTP_SEND_FAILED: " + ex.getMessage());
        }
    }



    public void sendStudentAcceptedEmail(Student student, String studentId, String temporaryPassword) {
        if (mailHost == null || mailHost.isBlank()) {
            logger.warn("SMTP host not configured; skipping student acceptance email for {}", student.getEmail());
            throw new IllegalStateException("SMTP_NOT_CONFIGURED");
        }
        verifySmtpConnection();
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(student.getEmail());
            message.setSubject("Acces a la plateforme - Vos identifiants de connexion");
            message.setText(buildStudentAcceptedMessage(student, studentId, temporaryPassword));
            mailSender.send(message);
        } catch (Exception ex) {
            logger.warn("Failed to send student acceptance email to {}", student.getEmail(), ex);
            throw new IllegalStateException("SMTP_SEND_FAILED: " + ex.getMessage());
        }
    }

    public void sendStudentWaitlistEmail(Student student) {
        if (mailHost == null || mailHost.isBlank()) {
            logger.warn("SMTP host not configured; skipping waitlist email for {}", student.getEmail());
            throw new IllegalStateException("SMTP_NOT_CONFIGURED");
        }
        verifySmtpConnection();
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(student.getEmail());
            message.setSubject("Inscription en attente - Plateforme de formation");
            message.setText(buildStudentWaitlistMessage(student));
            mailSender.send(message);
        } catch (Exception ex) {
            logger.warn("Failed to send waitlist email to {}", student.getEmail(), ex);
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

    private String buildResetMessage(User user, String resetLink) {
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        if (fullName.isBlank()) {
            fullName = "Bonjour";
        } else {
            fullName = "Bonjour " + fullName;
        }
        return fullName + ",\n\n"
                + "Vous avez demandé une réinitialisation de mot de passe.\n"
                + "Cliquez sur le lien suivant pour définir un nouveau mot de passe :\n"
                + resetLink + "\n\n"
                + "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.";
    }



    private String buildStudentAcceptedMessage(Student student, String studentId, String temporaryPassword) {
        String fullName = ((student.getFirstName() != null ? student.getFirstName() : "") + " "
                + (student.getLastName() != null ? student.getLastName() : "")).trim();
        if (fullName.isBlank()) {
            fullName = "Bonjour";
        } else {
            fullName = "Bonjour " + fullName;
        }
        return fullName + ",\n\n"
                + "Nous avons le plaisir de vous informer que votre inscription a ete acceptee.\n\n"
                + "Voici vos identifiants personnels pour acceder a la plateforme :\n\n"
                + "Identifiant : " + (studentId != null ? studentId : "") + "\n"
                + "Mot de passe : " + (temporaryPassword != null ? temporaryPassword : "") + "\n\n"
                + "Vous pouvez vous connecter des maintenant via :\n"
                + "- L'application mobile\n"
                + "- La plateforme en ligne\n\n"
                + "Pour des raisons de securite, nous vous recommandons de changer votre mot de passe lors de votre premiere connexion.\n\n"
                + "Bienvenue parmi nous et bonne reussite dans votre parcours de formation.\n\n"
                + "Cordialement,\n"
                + "L'equipe pedagogique";
    }

    private String buildStudentWaitlistMessage(Student student) {
        String fullName = ((student.getFirstName() != null ? student.getFirstName() : "") + " "
                + (student.getLastName() != null ? student.getLastName() : "")).trim();
        if (fullName.isBlank()) {
            fullName = "Bonjour";
        } else {
            fullName = "Bonjour " + fullName;
        }
        return fullName + ",\n\n"
                + "Nous vous remercions pour votre interet pour notre plateforme de formation.\n\n"
                + "Actuellement, le nombre maximum d'eleves autorises a ete atteint.\n"
                + "Votre demande d'inscription a donc ete placee en liste d'attente.\n\n"
                + "Des qu'une place se liberera, vous recevrez un e-mail contenant :\n"
                + "- Votre identifiant personnel\n"
                + "- Votre mot de passe\n"
                + "- Les instructions d'acces a la plateforme\n\n"
                + "Aucune action n'est requise de votre part pour le moment.\n\n"
                + "Merci pour votre patience et votre comprehension.\n\n"
                + "Cordialement,\n"
                + "L'equipe pedagogique";
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
