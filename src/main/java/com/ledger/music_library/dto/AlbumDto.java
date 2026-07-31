package com.ledger.music_library.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AlbumDto {
    private Long id;

    @NotBlank(message = "appleCatalogId is required")
    private String appleCatalogId;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "artistName is required")
    private String artistName;

    private String genre;

    private LocalDate releaseDate;

    @Min(value = 1, message = "trackCount must be at least 1")
    private Integer trackCount;

    @Size(max = 1000, message = "artworkUrl must be at most 1000 characters")
    private String artworkUrl;

    @Min(value = 1, message = "userRating must be between 1 and 5")
    @Max(value = 5, message = "userRating must be between 1 and 5")
    private Integer userRating;

    @Size(max = 2000, message = "userNotes must be at most 2000 characters")
    private String userNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
