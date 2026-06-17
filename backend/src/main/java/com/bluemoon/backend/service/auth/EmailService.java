package com.bluemoon.backend.service.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Send a professional HTML email containing the 6-digit OTP code.
     */
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("BlueMoon - Your Verification Code");
            helper.setText(buildOtpEmailHtml(otp), true);

            mailSender.send(message);
            System.out.println("OTP email sent to: " + toEmail);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    private String buildOtpEmailHtml(String otp) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>");
        sb.append("<html><head><meta charset='UTF-8'></head>");
        sb.append("<body style='margin:0;padding:0;background:#f4f4f7;font-family:Inter,Arial,sans-serif;'>");
        sb.append("<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f7;padding:40px 0;'>");
        sb.append("<tr><td align='center'>");
        sb.append("<table width='480' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>");

        // Header
        sb.append("<tr><td style='background:linear-gradient(135deg,#6366f1,#a78bfa);padding:32px;text-align:center;'>");
        sb.append("<h1 style='margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;'>BlueMoon</h1>");
        sb.append("<p style='margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;'>Apartment Management System</p>");
        sb.append("</td></tr>");

        // Body
        sb.append("<tr><td style='padding:40px 32px;'>");
        sb.append("<h2 style='margin:0 0 8px;font-size:20px;color:#1a1a2e;'>Email Verification</h2>");
        sb.append("<p style='margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;'>Please use the following code to verify your email address. This code will expire in <strong>5 minutes</strong>.</p>");

        // OTP Code Display
        sb.append("<div style='text-align:center;margin:32px 0;'>");
        sb.append("<div style='display:inline-block;background:#f0f0ff;border:2px dashed #6366f1;border-radius:12px;padding:20px 40px;'>");
        sb.append("<span style='font-size:36px;font-weight:800;letter-spacing:12px;color:#6366f1;font-family:monospace;'>");
        sb.append(otp);
        sb.append("</span>");
        sb.append("</div>");
        sb.append("</div>");

        sb.append("<p style='margin:0;color:#9ca3af;font-size:13px;line-height:1.5;'>If you did not request this verification, please ignore this email. Do not share this code with anyone.</p>");
        sb.append("</td></tr>");

        // Footer
        sb.append("<tr><td style='background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;'>");
        sb.append("<p style='margin:0;color:#9ca3af;font-size:12px;'>&copy; 2026 BlueMoon. All rights reserved.</p>");
        sb.append("</td></tr>");

        sb.append("</table>");
        sb.append("</td></tr></table>");
        sb.append("</body></html>");

        return sb.toString();
    }
}
