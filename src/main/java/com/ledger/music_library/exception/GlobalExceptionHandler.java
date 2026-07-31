package com.ledger.music_library.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppError.class)
    public ResponseEntity<Map<String, Object>> handleAppError(AppError error) {
        return ResponseEntity.status(error.getStatusCode()).body(errorBody(
                error.getCode(), error.getStatusCode(), error.getMessage(), error.getFieldErrors()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        ValidationError error = new ValidationError(ex.getBindingResult().getFieldErrors());
        return ResponseEntity.status(error.getStatusCode()).body(errorBody(
                error.getCode(), error.getStatusCode(), error.getMessage(), error.getFieldErrors()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(
                "UNAUTHORIZED", 401, "Invalid email or password", null));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
                "BAD_REQUEST", 400, "Malformed request body", null));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
                "BAD_REQUEST", 400, "Invalid parameter: " + ex.getName(), null));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody(
                "NOT_FOUND", 404, "Resource not found", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        logger.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(
                "INTERNAL_ERROR", 500, "Something went wrong", null));
    }

    private Map<String, Object> errorBody(String code, int status, String detail, Object fields) {
        return Map.of(
                "error", code,
                "status", status,
                "detail", detail,
                "timestamp", Instant.now().toString()
        );
    }
}
