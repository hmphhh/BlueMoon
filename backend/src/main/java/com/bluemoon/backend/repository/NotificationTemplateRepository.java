package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.NotificationTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplateEntity, Long> {
}
