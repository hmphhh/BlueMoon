package com.bluemoon.backend.entity;

import java.time.LocalDateTime;

import com.bluemoon.backend.enums.NotificationPriority;
import com.bluemoon.backend.enums.NotificationReferenceType;
import com.bluemoon.backend.enums.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column
    private LocalDateTime readAt;

    @Column(name = "is_deleted_by_user", nullable = false)
    private boolean deletedByUser;

    @Column
    private LocalDateTime userDeletedAt;

    @Column(name = "is_deleted_by_admin", nullable = false)
    private boolean deletedByAdmin;

    @Column
    private LocalDateTime adminDeletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationReferenceType referenceType;

    @Column
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
