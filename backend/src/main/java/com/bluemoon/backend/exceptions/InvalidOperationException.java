package com.bluemoon.backend.exceptions;

/**
 * Thrown when an operation cannot be completed due to invalid state or constraints.
 */
public class InvalidOperationException extends RuntimeException {

    public InvalidOperationException(String message) {
        super(message);
    }

    public InvalidOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
