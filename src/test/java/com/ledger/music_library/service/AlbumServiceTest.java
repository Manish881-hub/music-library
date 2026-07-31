package com.ledger.music_library.service;

import com.ledger.music_library.dto.AlbumDto;
import com.ledger.music_library.entity.Album;
import com.ledger.music_library.entity.User;
import com.ledger.music_library.exception.ConflictError;
import com.ledger.music_library.exception.ForbiddenError;
import com.ledger.music_library.exception.NotFoundError;
import com.ledger.music_library.repository.AlbumRepository;
import com.ledger.music_library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    private AlbumService albumService;
    private User user;

    @BeforeEach
    void setUp() {
        albumService = new AlbumService(albumRepository, userRepository);
        user = new User();
        user.setId(1L);
        user.setEmail("carol@example.com");
        lenient().when(authentication.getName()).thenReturn("carol@example.com");
        lenient().when(userRepository.findByEmail("carol@example.com")).thenReturn(Optional.of(user));
    }

    private AlbumDto sampleDto() {
        AlbumDto dto = new AlbumDto();
        dto.setAppleCatalogId("1440806041");
        dto.setTitle("Parachutes");
        dto.setArtistName("Coldplay");
        dto.setGenre("Alternative");
        return dto;
    }

    @Test
    void addAlbum_duplicateCatalogId_throwsConflict() {
        when(albumRepository.existsByUserIdAndAppleCatalogId(1L, "1440806041")).thenReturn(true);

        ConflictError ex = assertThrows(ConflictError.class,
                () -> albumService.addAlbum(sampleDto(), authentication));
        assertEquals("Album already in your library", ex.getMessage());
        verify(albumRepository, never()).save(any());
    }

    @Test
    void addAlbum_success_savesAndReturnsDto() {
        when(albumRepository.existsByUserIdAndAppleCatalogId(1L, "1440806041")).thenReturn(false);
        Album saved = new Album();
        saved.setId(10L);
        saved.setAppleCatalogId("1440806041");
        saved.setTitle("Parachutes");
        saved.setArtistName("Coldplay");
        saved.setUser(user);
        when(albumRepository.save(any(Album.class))).thenReturn(saved);

        AlbumDto result = albumService.addAlbum(sampleDto(), authentication);

        assertEquals(10L, result.getId());
        assertEquals("Parachutes", result.getTitle());
        assertEquals("Coldplay", result.getArtistName());
        verify(albumRepository, times(1)).save(any(Album.class));
    }

    @Test
    void updateAlbum_missingAlbum_throwsNotFound() {
        when(albumRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundError.class,
                () -> albumService.updateAlbum(99L, sampleDto(), authentication));
    }

    @Test
    void updateAlbum_otherUsersAlbum_throwsForbidden() {
        Album other = new Album();
        other.setId(5L);
        User otherUser = new User();
        otherUser.setId(2L);
        other.setUser(otherUser);
        when(albumRepository.findById(5L)).thenReturn(Optional.of(other));

        assertThrows(ForbiddenError.class,
                () -> albumService.updateAlbum(5L, sampleDto(), authentication));
    }

    @Test
    void updateAlbum_success_overwritesFields() {
        Album existing = new Album();
        existing.setId(5L);
        existing.setAppleCatalogId("1440806041");
        existing.setTitle("Old Title");
        existing.setArtistName("Old Artist");
        existing.setUser(user);
        when(albumRepository.findById(5L)).thenReturn(Optional.of(existing));

        AlbumDto dto = sampleDto();
        dto.setUserRating(4);
        dto.setUserNotes("Great");
        when(albumRepository.save(any(Album.class))).thenReturn(existing);

        AlbumDto result = albumService.updateAlbum(5L, dto, authentication);

        assertEquals("Parachutes", result.getTitle());
        assertEquals(4, result.getUserRating());
        assertEquals("Great", result.getUserNotes());
        verify(albumRepository, times(1)).save(existing);
    }

    @Test
    void deleteAlbum_success_deletes() {
        Album owned = new Album();
        owned.setId(5L);
        owned.setUser(user);
        when(albumRepository.findById(5L)).thenReturn(Optional.of(owned));

        albumService.deleteAlbum(5L, authentication);

        verify(albumRepository, times(1)).delete(owned);
    }

    @Test
    void getUserAlbums_returnsAllOwned() {
        Album a = new Album();
        a.setTitle("One");
        when(albumRepository.findByUserId(1L)).thenReturn(List.of(a));

        List<AlbumDto> result = albumService.getUserAlbums(authentication);

        assertEquals(1, result.size());
        assertEquals("One", result.get(0).getTitle());
    }
}
