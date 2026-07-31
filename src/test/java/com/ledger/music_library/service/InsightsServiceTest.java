package com.ledger.music_library.service;

import com.ledger.music_library.entity.Album;
import com.ledger.music_library.entity.User;
import com.ledger.music_library.repository.AlbumRepository;
import com.ledger.music_library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    private InsightsService insightsService;

    @BeforeEach
    void setUp() {
        insightsService = new InsightsService(albumRepository, userRepository);
        lenient().when(authentication.getName()).thenReturn("carol@example.com");
    }

    private Album album(String title, String genre, String artist, LocalDate release, Integer rating) {
        Album a = new Album();
        a.setTitle(title);
        a.setGenre(genre);
        a.setArtistName(artist);
        a.setReleaseDate(release);
        a.setUserRating(rating);
        a.setCreatedAt(LocalDateTime.of(2026, 7, 15, 10, 30));
        return a;
    }

    private User user(Long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("carol@example.com");
        return u;
    }

    @Test
    void getSummary_emptyLibrary_returnsZeroStatsAndEmptySummary() {
        User u = user(1L);
        when(userRepository.findByEmail("carol@example.com")).thenReturn(Optional.of(u));
        when(albumRepository.findByUserId(1L)).thenReturn(List.of());

        Map<String, Object> stats = insightsService.getSummary(authentication);

        assertEquals(0, stats.get("totalAlbums"));
        assertEquals(0.0, stats.get("averageRating"));
        assertTrue(((String) stats.get("summary")).contains("empty"));
    }

    @Test
    void getSummary_computesGenreArtistRatingAndReleaseStats() {
        User u = user(1L);
        when(userRepository.findByEmail("carol@example.com")).thenReturn(Optional.of(u));
        when(albumRepository.findByUserId(1L)).thenReturn(List.of(
                album("Parachutes", "Alternative", "Coldplay", LocalDate.of(2000, 7, 10), 5),
                album("A Rush of Blood", "Alternative", "Coldplay", LocalDate.of(2002, 8, 1), 4),
                album("Thriller", "Pop", "Michael Jackson", LocalDate.of(1982, 11, 30), 4)
        ));

        Map<String, Object> stats = insightsService.getSummary(authentication);

        assertEquals(3, stats.get("totalAlbums"));
        assertEquals(3, stats.get("ratedAlbums"));
        assertEquals(4.3, stats.get("averageRating"));

        Map<String, Long> genres = (Map<String, Long>) stats.get("topGenres");
        assertEquals("Alternative", genres.keySet().iterator().next());
        assertEquals(2L, genres.get("Alternative"));

        Map<String, Long> artists = (Map<String, Long>) stats.get("topArtists");
        assertEquals("Coldplay", artists.keySet().iterator().next());

        Map<Integer, Long> ratings = (Map<Integer, Long>) stats.get("ratingDistribution");
        assertEquals(2L, ratings.get(4));
        assertEquals(1L, ratings.get(5));

        Map<String, Long> decades = (Map<String, Long>) stats.get("releaseDecades");
        assertEquals(1L, decades.get("1980s"));
        assertEquals(2L, decades.get("2000s"));

        Map<Integer, Long> years = (Map<Integer, Long>) stats.get("releaseYears");
        assertEquals(1L, years.get(1982));
        assertEquals(2L, years.get(2000) + years.get(2002));

        Map<String, Long> byMonth = (Map<String, Long>) stats.get("albumsAddedByMonth");
        assertEquals(3L, byMonth.get("2026-07"));

        String summary = (String) stats.get("summary");
        assertTrue(summary.contains("alternative"));
        assertTrue(summary.contains("3 albums"));
        assertTrue(summary.contains("4.3"));
        assertTrue(summary.contains("2000s"));
    }

    @Test
    void getSummary_unratedAlbums_skipsRatingStats() {
        User u = user(1L);
        when(userRepository.findByEmail("carol@example.com")).thenReturn(Optional.of(u));
        when(albumRepository.findByUserId(1L)).thenReturn(List.of(
                album("Ghost", "Pop", "Sky Ferreira", LocalDate.of(2014, 1, 1), null)
        ));

        Map<String, Object> stats = insightsService.getSummary(authentication);

        assertEquals(0, stats.get("ratedAlbums"));
        assertEquals(0.0, stats.get("averageRating"));
        Map<Integer, Long> ratings = (Map<Integer, Long>) stats.get("ratingDistribution");
        assertTrue(ratings.isEmpty());
    }
}
