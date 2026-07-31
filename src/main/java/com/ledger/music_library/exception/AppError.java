package com.ledger.music_library.exception;

import java.util.Map;

public abstract class AppError extends RuntimeException {

    private final String code;
    private final int statusCode;

    protected AppError(String message, String code, int statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }

    public String getCode() {
        return code;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public Map<String, String> getFieldErrors() {
        return null;
    }
}
