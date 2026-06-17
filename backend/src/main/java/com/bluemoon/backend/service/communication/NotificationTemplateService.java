package com.bluemoon.backend.service.communication;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.communication.NotificationTemplateRequest;
import com.bluemoon.backend.dtos.response.communication.NotificationTemplateResponse;
import com.bluemoon.backend.entity.communication.NotificationTemplateEntity;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.communication.NotificationTemplateRepository;

@Service
public class NotificationTemplateService {

    @Autowired
    private NotificationTemplateRepository templateRepository;

    /**
     * Get all notification templates.
     */
    public List<NotificationTemplateResponse> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get a notification template by ID.
     */
    public NotificationTemplateResponse getTemplateById(Long id) {
        NotificationTemplateEntity template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification template not found with id: " + id));
        return toResponse(template);
    }

    /**
     * Get template entity by ID (used by NotificationService for sending).
     */
    public NotificationTemplateEntity getTemplateEntityById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification template not found with id: " + id));
    }

    /**
     * Create a new notification template.
     */
    @Transactional
    public NotificationTemplateResponse createTemplate(NotificationTemplateRequest request) {
        NotificationTemplateEntity template = new NotificationTemplateEntity();
        template.setTitle(request.getTitle());
        template.setMessage(request.getMessage());

        template = templateRepository.save(template);
        return toResponse(template);
    }

    /**
     * Update a notification template. Does not affect previously generated notifications.
     */
    @Transactional
    public NotificationTemplateResponse updateTemplate(Long id, NotificationTemplateRequest request) {
        NotificationTemplateEntity template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification template not found with id: " + id));

        if (request.getTitle() != null) {
            template.setTitle(request.getTitle());
        }
        if (request.getMessage() != null) {
            template.setMessage(request.getMessage());
        }

        template = templateRepository.save(template);
        return toResponse(template);
    }

    /**
     * Delete a notification template. Does not affect previously generated notifications.
     */
    @Transactional
    public void deleteTemplate(Long id) {
        NotificationTemplateEntity template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification template not found with id: " + id));
        templateRepository.delete(template);
    }

    private NotificationTemplateResponse toResponse(NotificationTemplateEntity entity) {
        return new NotificationTemplateResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
