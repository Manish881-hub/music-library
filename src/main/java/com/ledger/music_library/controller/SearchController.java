package com.ledger.music_library.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private static final Set<String> ALLOWED_ENTITIES = Set.of("album", "song", "musicArtist");
    private static final int MAX_LIMIT = 50;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(required = false) String term,
                                    @RequestParam(required = false) String query,
                                    @RequestParam(defaultValue = "album") String type,
                                    @RequestParam(defaultValue = "album") String entity,
                                    @RequestParam(defaultValue = "25") int limit) {
        String searchTerm = term != null && !term.isBlank() ? term : query;
        if (searchTerm == null || searchTerm.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "VALIDATION", "detail", "query is required"));
        }

        String entityType = type != null && !type.isBlank() ? type : entity;
        if (!ALLOWED_ENTITIES.contains(entityType)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "VALIDATION", "detail", "type must be one of: album, song, musicArtist"));
        }

        int cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        String url = UriComponentsBuilder
                .fromUriString("https://itunes.apple.com/search")
                .queryParam("term", searchTerm)
                .queryParam("entity", entityType)
                .queryParam("limit", cappedLimit)
                .build()
                .toUriString();

        try {
            String responseBody = restTemplate.getForObject(url, String.class);
            Map result = objectMapper.readValue(responseBody, Map.class);
            return ResponseEntity.ok(result);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                    Map.of("error", "UPSTREAM", "detail", "iTunes Search API is unavailable right now"));
        } catch (JsonProcessingException e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "UPSTREAM", "detail", "Failed to parse iTunes response"));
        }
    }
}
