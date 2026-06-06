package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.BillTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillTemplateRepository extends JpaRepository<BillTemplateEntity, Long> {
}
