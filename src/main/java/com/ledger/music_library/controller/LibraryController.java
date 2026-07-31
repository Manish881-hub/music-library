package com.ledger.music_library.controller;

import com.ledger.music_library.dto.AlbumDto;
import com.ledger.music_library.service.AlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryController {

    private final AlbumService albumService;

    @GetMapping
    public ResponseEntity<List<AlbumDto>> getLibrary(Authentication authentication) {
        return ResponseEntity.ok(albumService.getUserAlbums(authentication));
    }

    @PostMapping
    public ResponseEntity<AlbumDto> addAlbum(@Valid @RequestBody AlbumDto albumDto,
                                              Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(albumService.addAlbum(albumDto, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlbumDto> updateAlbum(@PathVariable Long id,
                                                 @Valid @RequestBody AlbumDto albumDto,
                                                 Authentication authentication) {
        return ResponseEntity.ok(albumService.updateAlbum(id, albumDto, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Long id,
                                            Authentication authentication) {
        albumService.deleteAlbum(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
