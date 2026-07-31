"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { ApiError, ITunesResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface SearchResultCardProps {
  result: ITunesResult;
  saved: boolean;
  busy: boolean;
  onSave: (result: ITunesResult) => void;
}

export function SearchResultCard({
  result,
  saved,
  busy,
  onSave,
}: SearchResultCardProps) {
  const releaseYear = result.releaseDate
    ? new Date(result.releaseDate).getFullYear()
    : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-raised">
        {result.artworkUrl100 ? (
          <Image
            src={result.artworkUrl100.replace("100x100", "300x300")}
            alt={`${result.collectionName} by ${result.artistName}`}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MagnifyingGlass size={28} className="text-faint" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {result.collectionName}
        </h3>
        <p className="line-clamp-1 text-sm text-muted">{result.artistName}</p>
        <p className="text-xs text-faint">
          {result.primaryGenreName}
          {result.trackCount ? ` · ${result.trackCount} tracks` : ""}
          {releaseYear ? ` · ${releaseYear}` : ""}
        </p>

        <div className="mt-auto pt-2">
          <Button
            variant={saved ? "ghost" : "primary"}
            size="sm"
            disabled={saved || busy}
            onClick={() => onSave(result)}
            className="w-full"
          >
            {saved ? (
              <>
                <Check size={16} weight="bold" /> In library
              </>
            ) : (
              <>
                <Plus size={16} weight="bold" /> Save to library
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.li>
  );
}

export function SearchResultSkeleton() {
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="skeleton aspect-square w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-3 w-2/3 rounded-full" />
        <div className="skeleton mt-2 h-9 w-full rounded-full" />
      </div>
    </li>
  );
}

export function useSaveToLibrary(savedIds: Set<number>) {
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(savedIds);
  const [error, setError] = useState<string | null>(null);

  async function save(result: ITunesResult) {
    if (saved.has(result.collectionId)) return;
    setSavingId(result.collectionId);
    setError(null);
    try {
      await api.addAlbum({
        appleCatalogId: String(result.collectionId),
        title: result.collectionName,
        artistName: result.artistName,
        genre: result.primaryGenreName ?? null,
        releaseDate: result.releaseDate ? result.releaseDate.slice(0, 10) : null,
        trackCount: result.trackCount ?? null,
        artworkUrl: result.artworkUrl100 ?? null,
        userRating: null,
        userNotes: null,
      });
      setSaved((prev) => new Set(prev).add(result.collectionId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSaved((prev) => new Set(prev).add(result.collectionId));
        setError("That album is already in your library.");
      } else {
        setError(
          err instanceof ApiError
            ? `Could not save: ${err.message}`
            : "Could not save that album."
        );
      }
    } finally {
      setSavingId(null);
    }
  }

  return { saved, savingId, error, save, setSaved };
}
