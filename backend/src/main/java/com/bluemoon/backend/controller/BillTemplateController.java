package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.BillTemplateRequest;
import com.bluemoon.backend.dtos.response.BillTemplateResponse;
import com.bluemoon.backend.dtos.response.BillTemplateSummaryResponse;
import com.bluemoon.backend.service.BillTemplateService;

@RestController
@RequestMapping("/api/bill-templates")
public class BillTemplateController {

    @Autowired
    private BillTemplateService billTemplateService;

    /**
     * GET /api/bill-templates — List all templates (summary).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<BillTemplateSummaryResponse>> getAllTemplates() {
        return ResponseEntity.ok(billTemplateService.getAllTemplates());
    }

    /**
     * GET /api/bill-templates/{templateId} — Template details.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{templateId}")
    public ResponseEntity<BillTemplateResponse> getTemplate(@PathVariable Long templateId) {
        return ResponseEntity.ok(billTemplateService.getTemplateById(templateId));
    }

    /**
     * POST /api/bill-templates — Create template.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BillTemplateResponse> createTemplate(@RequestBody BillTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billTemplateService.createTemplate(request));
    }

    /**
     * PATCH /api/bill-templates/{templateId} — Update template.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{templateId}")
    public ResponseEntity<BillTemplateResponse> updateTemplate(@PathVariable Long templateId,
                                                                @RequestBody BillTemplateRequest request) {
        return ResponseEntity.ok(billTemplateService.updateTemplate(templateId, request));
    }

    /**
     * DELETE /api/bill-templates/{templateId} — Delete template.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Long templateId) {
        billTemplateService.deleteTemplate(templateId);
        return ResponseEntity.ok(Map.of("message", "Template deleted successfully"));
    }
}
