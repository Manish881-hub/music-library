package com.ledger.music_library.exception;

public class NotFoundError extends AppError {

    public NotFoundError(String resource, String id) {
        super(resource + " not found: " + id, "NOT_FOUND", 404);
    }
}
