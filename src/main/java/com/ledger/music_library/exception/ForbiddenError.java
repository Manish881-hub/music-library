package com.ledger.music_library.exception;

public class ForbiddenError extends AppError {

    public ForbiddenError(String message) {
        super(message, "FORBIDDEN", 403);
    }
}
