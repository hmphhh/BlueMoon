package com.bluemoon.backend.config;
import com.bluemoon.backend.enums.communication.NotificationType;


import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.enums.apartment.ApartmentType;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    @Order(1)
    CommandLineRunner seedData(ApartmentRepository apartmentRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Seed apartments: 4 floors, 3 rooms each (101-403)
            for (int floor = 1; floor <= 4; floor++) {
                for (int room = 1; room <= 3; room++) {
                    String number = floor + "0" + room;
                    if (apartmentRepository.findByApartmentNumber(number).isEmpty()) {
                        ApartmentEntity savedEntity = new ApartmentEntity(number);
                        savedEntity.setArea(50.0d);
                        savedEntity.setFloor(floor);
                        savedEntity.setType(ApartmentType.STUDIO);
                        apartmentRepository.save(savedEntity);
                    }
                }
            }
            System.out.println("✅ Apartments seeded (4 floors × 3 rooms = 12 units)");

            // 2. Seed default admin account if it doesn't exist
            String adminPhone = "00000000";
            String adminIdNumber = "00000000";

            if (userRepository.findByUsername(adminPhone).isEmpty()) {
                UserEntity admin = new UserEntity();
                admin.setUsername(adminPhone); // phone number as login account
                admin.setPassword(passwordEncoder.encode(adminIdNumber)); // ID number as default password
                admin.setEmail("admin@bluemoon.com");
                admin.setRole(UserRole.ADMIN);
                admin.setVerified(false);
                admin.setPhone(adminPhone);
                admin.setIdNumber(adminIdNumber);
                userRepository.save(admin);
                System.out.println("✅ Default admin account created (phone: " + adminPhone + ", password: ID number " + adminIdNumber + ")");
            }
        };
    }

    /**
     * Migrate old notification type values that no longer exist in the NotificationType enum.
     * Without this, Hibernate throws IllegalArgumentException when loading rows with
     * stale enum values, causing "failed to load notifications" errors.
     */
    @Bean
    @Order(0)
    CommandLineRunner migrateNotificationTypes(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                int updated = 0;

                // REPORT_REVIEWED → REPORT_APPROVED (safe default)
                updated += jdbcTemplate.update(
                    "UPDATE notifications SET type = 'REPORT_APPROVED' WHERE type = 'REPORT_REVIEWED'"
                );

                // SYSTEM → SYSTEM_ERROR
                updated += jdbcTemplate.update(
                    "UPDATE notifications SET type = 'SYSTEM_ERROR' WHERE type = 'SYSTEM'"
                );

                if (updated > 0) {
                    System.out.println("✅ Migrated " + updated + " notification(s) with old type values");
                }
            } catch (Exception e) {
                // Table may not exist on first run — safe to ignore
                System.out.println("⚠️ Notification migration skipped (table may not exist yet): " + e.getMessage());
            }
        };
    }
}

