package com.bluemoon.backend.config;

import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.enums.UserRole;
import com.bluemoon.backend.enums.ApartmentType;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
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
}
