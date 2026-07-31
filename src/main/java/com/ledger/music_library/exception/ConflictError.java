package com.ledger.music_library.exception;

public class ConflictError extends AppError {

    public ConflictError(String message) {
        super(message, "CONFLICT", 409);
    }
}
