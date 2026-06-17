package com.bluemoon.backend.repository.communication;

import com.bluemoon.backend.entity.communication.NotificationTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplateEntity, Long> {
}
