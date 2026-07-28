package com.ledger.music_library.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    public ResponseEntity<?> search(@RequestParam String term,
                                    @RequestParam(defaultValue = "album") String entity,
                                    @RequestParam(defaultValue = "25") int limit) {
        String url = String.format(
                "https://itunes.apple.com/search?term=%s&entity=%s&limit=%d",
                term, entity, limit
        );
        Map result = restTemplate.getForObject(url, Map.class);
        return ResponseEntity.ok(result);
    }
}
