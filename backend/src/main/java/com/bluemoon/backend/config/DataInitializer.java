package com.bluemoon.backend.config;

import com.bluemoon.backend.entity.Apartment;
import com.bluemoon.backend.entity.User;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
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
            // 1. Seed apartments: 6 floors, 4 rooms each (101-604)
            for (int floor = 1; floor <= 6; floor++) {
                for (int room = 1; room <= 4; room++) {
                    String number = floor + "0" + room;
                    if (apartmentRepository.findByApartmentNumber(number).isEmpty()) {
                        apartmentRepository.save(new Apartment(number));
                    }
                }
            }
            System.out.println("✅ Apartments seeded (6 floors × 4 rooms = 24 units)");

            // 2. Seed default admin account if it doesn't exist
            String adminPhone = "0888104061";
            String adminCCCD = "035206007545";

            if (userRepository.findByUsername(adminPhone).isEmpty()) {
                User admin = new User();
                admin.setUsername(adminPhone);
                admin.setPassword(passwordEncoder.encode(adminCCCD));
                admin.setPhoneNumber(adminPhone);
                admin.setIdentityCardNumber(adminCCCD);
                admin.setRole("ADMIN");
                admin.setFullName("Administrator");
                // No apartment for admin
                userRepository.save(admin);
                System.out.println("✅ Default admin account created (phone: " + adminPhone + ")");
            }
        };
    }
}
