package com.bluemoon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String token) {
        String verifyUrl = "http://localhost:8080/api/users/verify-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BlueMoon - Verify Your Email Address");
        message.setText(
            "Hello,\n\n" +
            "Please click the link below to verify your email address:\n\n" +
            verifyUrl + "\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "Best regards,\nBlueMoon Team"
        );

        mailSender.send(message);
        System.out.println("Verification email sent to: " + toEmail);
    }
}
