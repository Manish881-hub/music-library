package com.ledger.music_library.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "albums", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "apple_catalog_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Album {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "apple_catalog_id", nullable = false)
    private String appleCatalogId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artistName;

    private String genre;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "track_count")
    private Integer trackCount;

    @Column(name = "artwork_url", length = 1000)
    private String artworkUrl;

    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "user_notes", length = 2000)
    private String userNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
