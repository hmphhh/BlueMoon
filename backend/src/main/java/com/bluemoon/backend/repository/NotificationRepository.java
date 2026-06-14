package com.bluemoon.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bluemoon.backend.entity.NotificationEntity;
import com.bluemoon.backend.enums.NotificationType;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    /**
     * Count unread, non-deleted notifications for a user.
     */
    @Query("""
        SELECT COUNT(n) FROM NotificationEntity n
        WHERE n.user.id = :userId
          AND n.read = false
          AND n.deletedByUser = false
          AND n.deletedByAdmin = false
    """)
    long countUnreadByUserId(@Param("userId") Long userId);

    /**
     * Paginated user notifications — excludes deleted.
     * No type filter.
     */
    @Query("""
        SELECT n FROM NotificationEntity n
        WHERE n.user.id = :userId
          AND n.deletedByUser = false
          AND n.deletedByAdmin = false
          AND (:read IS NULL OR n.read = :read)
        ORDER BY n.createdAt DESC
    """)
    Page<NotificationEntity> findUserNotifications(
        @Param("userId") Long userId,
        @Param("read") Boolean read,
        Pageable pageable
    );

    /**
     * Paginated user notifications filtered by category (list of types).
     */
    @Query("""
        SELECT n FROM NotificationEntity n
        WHERE n.user.id = :userId
          AND n.deletedByUser = false
          AND n.deletedByAdmin = false
          AND n.type IN :types
          AND (:read IS NULL OR n.read = :read)
        ORDER BY n.createdAt DESC
    """)
    Page<NotificationEntity> findUserNotificationsByTypes(
        @Param("userId") Long userId,
        @Param("types") List<NotificationType> types,
        @Param("read") Boolean read,
        Pageable pageable
    );

    /**
     * Admin paginated notifications — no type filter.
     */
    @Query("""
        SELECT n FROM NotificationEntity n
        WHERE (:read IS NULL OR n.read = :read)
          AND (:deleted IS NULL OR n.deletedByAdmin = :deleted)
          AND (:userId IS NULL OR n.user.id = :userId)
        ORDER BY n.createdAt DESC
    """)
    Page<NotificationEntity> findAdminNotifications(
        @Param("read") Boolean read,
        @Param("deleted") Boolean deleted,
        @Param("userId") Long userId,
        Pageable pageable
    );

    /**
     * Admin paginated notifications filtered by category (list of types).
     */
    @Query("""
        SELECT n FROM NotificationEntity n
        WHERE n.type IN :types
          AND (:read IS NULL OR n.read = :read)
          AND (:deleted IS NULL OR n.deletedByAdmin = :deleted)
          AND (:userId IS NULL OR n.user.id = :userId)
        ORDER BY n.createdAt DESC
    """)
    Page<NotificationEntity> findAdminNotificationsByTypes(
        @Param("types") List<NotificationType> types,
        @Param("read") Boolean read,
        @Param("deleted") Boolean deleted,
        @Param("userId") Long userId,
        Pageable pageable
    );

    /**
     * Mark all unread, non-deleted notifications as read for a user.
     */
    @Modifying
    @Query("""
        UPDATE NotificationEntity n
        SET n.read = true, n.readAt = CURRENT_TIMESTAMP
        WHERE n.user.id = :userId
          AND n.read = false
          AND n.deletedByUser = false
          AND n.deletedByAdmin = false
    """)
    int markAllAsReadByUserId(@Param("userId") Long userId);

    /**
     * Soft-delete all non-deleted notifications for a user.
     */
    @Modifying
    @Query("""
        UPDATE NotificationEntity n
        SET n.deletedByUser = true, n.userDeletedAt = CURRENT_TIMESTAMP
        WHERE n.user.id = :userId
          AND n.deletedByUser = false
          AND n.deletedByAdmin = false
    """)
    int softDeleteAllByUserId(@Param("userId") Long userId);

    /**
     * Find all non-deleted notification IDs for admin bulk delete.
     */
    List<NotificationEntity> findAllByIdIn(List<Long> ids);
}

