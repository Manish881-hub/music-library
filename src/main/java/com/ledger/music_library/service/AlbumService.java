package com.ledger.music_library.service;

import com.ledger.music_library.dto.AlbumDto;
import com.ledger.music_library.entity.Album;
import com.ledger.music_library.entity.User;
import com.ledger.music_library.repository.AlbumRepository;
import com.ledger.music_library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final UserRepository userRepository;

    public List<AlbumDto> getUserAlbums(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return albumRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AlbumDto addAlbum(AlbumDto albumDto, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        Album album = new Album();
        album.setAppleCatalogId(albumDto.getAppleCatalogId());
        album.setTitle(albumDto.getTitle());
        album.setArtistName(albumDto.getArtistName());
        album.setGenre(albumDto.getGenre());
        album.setReleaseDate(albumDto.getReleaseDate());
        album.setTrackCount(albumDto.getTrackCount());
        album.setArtworkUrl(albumDto.getArtworkUrl());
        album.setUserRating(albumDto.getUserRating());
        album.setUserNotes(albumDto.getUserNotes());
        album.setUser(user);

        Album saved = albumRepository.save(album);
        return toDto(saved);
    }

    @Transactional
    public AlbumDto updateAlbum(Long id, AlbumDto albumDto, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));

        if (!album.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        album.setUserRating(albumDto.getUserRating());
        album.setUserNotes(albumDto.getUserNotes());
        album.setTitle(albumDto.getTitle());
        album.setArtistName(albumDto.getArtistName());
        album.setGenre(albumDto.getGenre());
        album.setReleaseDate(albumDto.getReleaseDate());
        album.setTrackCount(albumDto.getTrackCount());
        album.setArtworkUrl(albumDto.getArtworkUrl());

        Album saved = albumRepository.save(album);
        return toDto(saved);
    }

    @Transactional
    public void deleteAlbum(Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));

        if (!album.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        albumRepository.delete(album);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private AlbumDto toDto(Album album) {
        AlbumDto dto = new AlbumDto();
        dto.setId(album.getId());
        dto.setAppleCatalogId(album.getAppleCatalogId());
        dto.setTitle(album.getTitle());
        dto.setArtistName(album.getArtistName());
        dto.setGenre(album.getGenre());
        dto.setReleaseDate(album.getReleaseDate());
        dto.setTrackCount(album.getTrackCount());
        dto.setArtworkUrl(album.getArtworkUrl());
        dto.setUserRating(album.getUserRating());
        dto.setUserNotes(album.getUserNotes());
        dto.setCreatedAt(album.getCreatedAt());
        dto.setUpdatedAt(album.getUpdatedAt());
        return dto;
    }
}
