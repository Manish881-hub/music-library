export interface Album {
  id: number;
  appleCatalogId: string;
  title: string;
  artistName: string;
  genre: string | null;
  releaseDate: string | null;
  trackCount: number | null;
  artworkUrl: string | null;
  userRating: number | null;
  userNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AlbumInput = Pick<
  Album,
  | "appleCatalogId"
  | "title"
  | "artistName"
  | "genre"
  | "releaseDate"
  | "trackCount"
  | "artworkUrl"
  | "userRating"
  | "userNotes"
>;

export interface AuthResponse {
  token: string;
  email: string;
}

export interface ITunesResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackCount?: number;
  artworkUrl100?: string;
  collectionViewUrl?: string;
}

export interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesResult[];
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
