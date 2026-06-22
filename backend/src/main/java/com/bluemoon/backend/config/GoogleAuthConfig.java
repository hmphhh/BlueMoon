package com.bluemoon.backend.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

/**
 * Provides a reusable, Spring-managed {@link GoogleIdTokenVerifier} bean.
 * The verifier is configured with the expected audience (Google Client ID),
 * the trusted HTTP transport, and JSON factory.
 * Creating it once as a bean avoids the overhead of reconstructing it on
 * every Google login request.
 */
@Configuration
public class GoogleAuthConfig {

    @Value("${google.client-id}")
    private String googleClientId;

    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier() {
        return new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }
}
