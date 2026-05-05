package com.bluemoon.backend.exceptions;

/**
 * Thrown when provided credentials are invalid (username/password mismatch).
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }

    public InvalidCredentialsException(String message, Throwable cause) {
        super(message, cause);
    }
}
