package com.ledger.music_library.exception;

import lombok.Getter;
import org.springframework.validation.FieldError;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class ValidationError extends AppError {

    private final Map<String, String> fieldErrors;

    public ValidationError(List<FieldError> errors) {
        super("Validation failed", "VALIDATION_ERROR", 422);
        this.fieldErrors = errors.stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() == null
                                ? "Invalid value" : fieldError.getDefaultMessage(),
                        (first, second) -> first
                ));
    }
}
