package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.BillTemplateRequest;
import com.bluemoon.backend.dtos.response.BillTemplateResponse;
import com.bluemoon.backend.dtos.response.BillTemplateSummaryResponse;
import com.bluemoon.backend.entity.BillTemplateEntity;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.BillTemplateRepository;

@Service
public class BillTemplateService {

    @Autowired
    private BillTemplateRepository billTemplateRepository;

    /**
     * Get all bill templates (summary list).
     */
    public List<BillTemplateSummaryResponse> getAllTemplates() {
        return billTemplateRepository.findAll().stream()
                .map(t -> new BillTemplateSummaryResponse(t.getId(), t.getName(), t.getDefaultAmount()))
                .toList();
    }

    /**
     * Get a bill template by ID (full details).
     */
    public BillTemplateResponse getTemplateById(Long id) {
        BillTemplateEntity template = billTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill template not found with id: " + id));
        return toResponse(template);
    }

    /**
     * Get entity by ID (used by BillService for generation).
     */
    public BillTemplateEntity getTemplateEntityById(Long id) {
        return billTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill template not found with id: " + id));
    }

    /**
     * Create a new bill template.
     */
    @Transactional
    public BillTemplateResponse createTemplate(BillTemplateRequest request) {
        BillTemplateEntity template = new BillTemplateEntity();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setDefaultAmount(request.getDefaultAmount());

        template = billTemplateRepository.save(template);
        return toResponse(template);
    }

    /**
     * Update a bill template. Changes do not affect existing bills.
     */
    @Transactional
    public BillTemplateResponse updateTemplate(Long id, BillTemplateRequest request) {
        BillTemplateEntity template = billTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill template not found with id: " + id));

        if (request.getName() != null) {
            template.setName(request.getName());
        }
        if (request.getDescription() != null) {
            template.setDescription(request.getDescription());
        }
        if (request.getDefaultAmount() != null) {
            template.setDefaultAmount(request.getDefaultAmount());
        }

        template = billTemplateRepository.save(template);
        return toResponse(template);
    }

    /**
     * Delete a bill template. Does not affect previously generated bills.
     */
    @Transactional
    public void deleteTemplate(Long id) {
        BillTemplateEntity template = billTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill template not found with id: " + id));
        billTemplateRepository.delete(template);
    }

    private BillTemplateResponse toResponse(BillTemplateEntity entity) {
        return new BillTemplateResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getDefaultAmount(),
                entity.getCreatedAt()
        );
    }
}
