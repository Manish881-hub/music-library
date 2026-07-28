package com.ledger.music_library.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AlbumDto {
    private Long id;
    private String appleCatalogId;
    private String title;
    private String artistName;
    private String genre;
    private LocalDate releaseDate;
    private Integer trackCount;
    private String artworkUrl;
    private Integer userRating;
    private String userNotes;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}
