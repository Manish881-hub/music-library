package com.ledger.music_library.repository;

import com.ledger.music_library.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbumRepository extends JpaRepository<Album, Long> {
    List<Album> findByUserId(Long userId);
    boolean existsByUserIdAndAppleCatalogId(Long userId, String appleCatalogId);
}
