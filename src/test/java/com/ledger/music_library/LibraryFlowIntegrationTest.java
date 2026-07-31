package com.ledger.music_library;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LibraryFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    private String validAlbumBody() {
        return """
                {
                  "appleCatalogId": "1440806041",
                  "title": "Parachutes",
                  "artistName": "Coldplay",
                  "genre": "Alternative",
                  "releaseDate": "2000-07-10",
                  "trackCount": 10,
                  "artworkUrl": "https://example.com/art.jpg",
                  "userRating": null,
                  "userNotes": null
                }
                """;
    }

    @BeforeEach
    void registerUser() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"carol@example.com\",\"password\":\"password123\"}"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 201 || status == 409,
                            "expected 201 or 409 but was " + status);
                });

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"carol@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        token = body.get("token").asText();

        MvcResult library = mockMvc.perform(get("/api/library")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        for (JsonNode album : objectMapper.readTree(library.getResponse().getContentAsString())) {
            mockMvc.perform(delete("/api/library/" + album.get("id").asText())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isNoContent());
        }
    }

    @Test
    void libraryCrudFlow_endToEnd() throws Exception {
        String albumId = mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Parachutes"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode created = objectMapper.readTree(albumId);
        String id = created.get("id").asText();

        mockMvc.perform(get("/api/library")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        String updatedBody = validAlbumBody()
                .replace("\"userRating\": null", "\"userRating\": 5")
                .replace("\"userNotes\": null", "\"userNotes\": \"A classic\"");
        mockMvc.perform(put("/api/library/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userRating").value(5))
                .andExpect(jsonPath("$.userNotes").value("A classic"))
                .andExpect(jsonPath("$.title").value("Parachutes"));

        mockMvc.perform(delete("/api/library/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/library")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void duplicateSave_returns409() throws Exception {
        mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    void missingRequiredFields_returns422WithFieldErrors() throws Exception {
        mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appleCatalogId\":\"1\",\"userNotes\":\"x\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors", aMapWithSize(2)));
    }

    @Test
    void invalidRating_returns422() throws Exception {
        mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody().replace("\"userRating\": null", "\"userRating\": 9")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors", aMapWithSize(1)));
    }

    @Test
    void unauthenticatedRequest_returns401() throws Exception {
        mockMvc.perform(get("/api/library"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anotherUsersAlbum_returns403() throws Exception {
        String albumId = objectMapper.readTree(mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andReturn()
                .getResponse()
                .getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"dave@example.com\",\"password\":\"password123\"}"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 201 || status == 409,
                            "expected 201 or 409 but was " + status);
                });
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"dave@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String otherToken = objectMapper.readTree(login.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(put("/api/library/" + albumId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/library/" + albumId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void insightsSummary_returnsStatsAndSummary() throws Exception {
        mockMvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validAlbumBody()))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/insights/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAlbums").value(1))
                .andExpect(jsonPath("$.summary").isNotEmpty())
                .andExpect(jsonPath("$.releaseYears").isNotEmpty());
    }

    @Test
    void search_requiresQueryParam() throws Exception {
        mockMvc.perform(get("/api/search"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION"));

        mockMvc.perform(get("/api/search?query=coldplay"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 200 || status == 502,
                            "expected 200 or 502 but was " + status);
                })
                .andExpect(jsonPath("$.error").doesNotExist());
    }
}
