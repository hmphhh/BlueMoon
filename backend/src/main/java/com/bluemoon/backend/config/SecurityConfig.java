package com.bluemoon.backend.config;

import com.bluemoon.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173")); // React dev server
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                // Payment webhook: uses API key authentication, not JWT
                .requestMatchers("/api/payment-webhooks/**").permitAll()
                // /api/users/me/** accessible by any authenticated user (must be before /api/users/**)
                .requestMatchers("/api/users/me/**").authenticated()
                .requestMatchers("/api/users/me").authenticated()
                // /api/apartments/me accessible by any authenticated user
                .requestMatchers("/api/apartments/me").authenticated()
                .requestMatchers("/api/apartments/me/users").authenticated()
                // /api/bills/me accessible by any authenticated user
                .requestMatchers("/api/bills/me").authenticated()
                // /api/bills/{id} accessible by any authenticated user (ownership checked in service)
                .requestMatchers("/api/bills/{billId}").authenticated()
                // /api/invoices/me accessible by any authenticated user
                .requestMatchers("/api/invoices/me").authenticated()
                // /api/invoices/{id} accessible by any authenticated user (ownership checked in controller)
                .requestMatchers("/api/invoices/{invoiceId}").authenticated()
                // POST /api/invoices/bill and /api/invoices/contribution accessible by any authenticated user
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/invoices/bill").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/invoices/contribution").authenticated()
                // DELETE /api/invoices/{id} accessible by any authenticated user (ownership checked in service)
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/invoices/{invoiceId}").authenticated()
                // Contribution campaigns: admin only (uses @PreAuthorize on controller)
                .requestMatchers("/api/contribution-campaigns/**").hasRole("ADMIN")
                // Apartment contributions: /me for authenticated users, /{id} for authenticated (ownership checked)
                .requestMatchers("/api/apartment-contributions/me").authenticated()
                .requestMatchers("/api/apartment-contributions/{id}").authenticated()
                .requestMatchers("/api/apartment-contributions/**").hasRole("ADMIN")
                // Other user, apartment, bill, and bill-template endpoints require ADMIN
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/apartments/**").hasRole("ADMIN")
                .requestMatchers("/api/residents/**").hasRole("ADMIN")
                .requestMatchers("/api/bills/**").hasRole("ADMIN")
                .requestMatchers("/api/bill-templates/**").hasRole("ADMIN")
                // Invoice and payment admin endpoints (GET /api/invoices, GET /api/payments)
                .requestMatchers("/api/invoices/**").hasRole("ADMIN")
                .requestMatchers("/api/payments/**").hasRole("ADMIN")
                // Report endpoints: /me is for authenticated users, other paths use @PreAuthorize
                .requestMatchers("/api/reports/me/**").authenticated()
                .requestMatchers("/api/reports/me").authenticated()
                .requestMatchers("/api/reports/**").authenticated()
                // Notification endpoints: /me is for authenticated users
                .requestMatchers("/api/notifications/me/**").authenticated()
                .requestMatchers("/api/notifications/me").authenticated()
                .requestMatchers("/api/notifications/*/read").authenticated()
                .requestMatchers("/api/notifications/*").authenticated()
                // Admin notification endpoints (uses @PreAuthorize on controller)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
