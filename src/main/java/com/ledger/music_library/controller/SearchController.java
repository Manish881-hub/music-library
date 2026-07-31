package com.ledger.music_library.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> search(@RequestParam String term,
                                    @RequestParam(defaultValue = "album") String entity,
                                    @RequestParam(defaultValue = "25") int limit) {
        String url = String.format(
                "https://itunes.apple.com/search?term=%s&entity=%s&limit=%d",
                term, entity, limit
        );
        String responseBody = restTemplate.getForObject(url, String.class);
        try {
            Map result = objectMapper.readValue(responseBody, Map.class);
            return ResponseEntity.ok(result);
        } catch (JsonProcessingException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to parse iTunes response"));
        }
    }
}
