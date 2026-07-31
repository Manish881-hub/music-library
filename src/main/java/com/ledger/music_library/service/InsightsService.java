package com.ledger.music_library.service;

import com.ledger.music_library.entity.Album;
import com.ledger.music_library.entity.User;
import com.ledger.music_library.exception.NotFoundError;
import com.ledger.music_library.repository.AlbumRepository;
import com.ledger.music_library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsightsService {

    private final AlbumRepository albumRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getSummary(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundError("User", authentication.getName()));

        List<Album> albums = albumRepository.findByUserId(user.getId());
        Map<String, Object> stats = buildStats(albums);
        stats.put("summary", buildSummary(stats, albums.size()));

        return stats;
    }

    private Map<String, Object> buildStats(List<Album> albums) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAlbums", albums.size());

        Map<String, Long> genreCounts = albums.stream()
                .filter(a -> a.getGenre() != null && !a.getGenre().isBlank())
                .collect(Collectors.groupingBy(Album::getGenre, Collectors.counting()));
        stats.put("topGenres", sortedDescending(genreCounts));

        Map<String, Long> artistCounts = albums.stream()
                .collect(Collectors.groupingBy(Album::getArtistName, Collectors.counting()));
        stats.put("topArtists", sortedDescending(artistCounts));

        List<Album> rated = albums.stream()
                .filter(a -> a.getUserRating() != null)
                .toList();
        stats.put("ratedAlbums", rated.size());
        double avgRating = rated.stream()
                .mapToInt(Album::getUserRating)
                .average()
                .orElse(0.0);
        stats.put("averageRating", Math.round(avgRating * 10.0) / 10.0);

        Map<Integer, Long> ratingDistribution = albums.stream()
                .filter(a -> a.getUserRating() != null)
                .collect(Collectors.groupingBy(Album::getUserRating, TreeMap::new, Collectors.counting()));
        stats.put("ratingDistribution", ratingDistribution);

        Map<String, Long> decadeCounts = albums.stream()
                .filter(a -> a.getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        a -> ((a.getReleaseDate().getYear() / 10) * 10) + "s",
                        TreeMap::new,
                        Collectors.counting()));
        stats.put("releaseDecades", decadeCounts);

        Map<Integer, Long> yearCounts = albums.stream()
                .filter(a -> a.getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getReleaseDate().getYear(),
                        TreeMap::new,
                        Collectors.counting()));
        stats.put("releaseYears", yearCounts);

        Map<String, Long> albumsByMonth = albums.stream()
                .filter(a -> a.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> String.format("%04d-%02d",
                                a.getCreatedAt().getYear(),
                                a.getCreatedAt().getMonthValue()),
                        TreeMap::new,
                        Collectors.counting()));
        stats.put("albumsAddedByMonth", albumsByMonth);

        return stats;
    }

    private Map<String, Long> sortedDescending(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    private String buildSummary(Map<String, Object> stats, int total) {
        if (total == 0) {
            return "Your library is empty so far. Search the catalog and save a few albums to start seeing trends here.";
        }

        StringBuilder sb = new StringBuilder();
        String topGenre = firstKey(stats.get("topGenres"));
        if (topGenre != null) {
            sb.append("You lean heavily toward ").append(topGenre.toLowerCase()).append(" — it's your most collected genre");
        } else {
            sb.append("Your collection spans a mix of genres");
        }
        sb.append(", with ").append(total).append(" album").append(total == 1 ? "" : "s");

        double avg = (double) stats.get("averageRating");
        if (avg > 0) {
            sb.append(" at an average rating of ").append(String.format("%.1f", avg)).append(" out of 5");
        }
        sb.append('.');

        String topArtist = firstKey(stats.get("topArtists"));
        if (topArtist != null) {
            sb.append(' ').append(topArtist).append(" shows up more than any other artist in your shelf.");
        }

        Map<String, Long> decades = castMap(stats.get("releaseDecades"));
        if (!decades.isEmpty()) {
            String topDecade = decades.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            if (topDecade != null) {
                sb.append(" Most of your picks were released in the ").append(topDecade).append('.');
            }
        }

        return sb.toString();
    }

    private String firstKey(Object map) {
        if (map instanceof Map<?, ?> m && !m.isEmpty()) {
            return String.valueOf(m.keySet().iterator().next());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Long> castMap(Object map) {
        return map instanceof Map<?, ?> m ? (Map<String, Long>) m : Map.of();
    }
}
