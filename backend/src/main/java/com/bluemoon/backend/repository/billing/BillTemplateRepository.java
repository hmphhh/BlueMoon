package com.bluemoon.backend.repository.billing;

import com.bluemoon.backend.entity.billing.BillTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillTemplateRepository extends JpaRepository<BillTemplateEntity, Long> {
}
