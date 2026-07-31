"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Books, MagnifyingGlass, PencilSimple, TrashSimple, X } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { Album } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/AuthGate";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { RatingStars } from "@/components/RatingStars";

function LibrarySkeleton() {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="skeleton h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded-full" />
            <div className="skeleton h-3 w-1/5 rounded-full" />
          </div>
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function LibraryRow({
  album,
  onEdit,
  onDelete,
  deleting,
}: {
  album: Album;
  onEdit: (album: Album) => void;
  onDelete: (album: Album) => void;
  deleting: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 p-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-raised">
        {album.artworkUrl ? (
          <Image
            src={album.artworkUrl.replace("100x100", "200x200")}
            alt={`${album.title} by ${album.artistName}`}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold tracking-tight">
          {album.title}
        </h3>
        <p className="truncate text-sm text-muted">{album.artistName}</p>
        <div className="mt-1 flex items-center gap-3">
          <RatingStars value={album.userRating ?? 0} size={14} />
          {album.genre ? (
            <span className="text-xs text-faint">{album.genre}</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(album)}
          aria-label={`Edit ${album.title}`}
        >
          <PencilSimple size={14} />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={deleting}
          onClick={() => onDelete(album)}
          aria-label={`Delete ${album.title}`}
        >
          <TrashSimple size={14} />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </motion.li>
  );
}

function EditModal({
  album,
  onClose,
  onSaved,
}: {
  album: Album;
  onClose: () => void;
  onSaved: (updated: Album) => void;
}) {
  const [rating, setRating] = useState(album.userRating ?? 0);
  const [notes, setNotes] = useState(album.userNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateAlbum(album.id, {
        appleCatalogId: album.appleCatalogId,
        title: album.title,
        artistName: album.artistName,
        genre: album.genre,
        releaseDate: album.releaseDate,
        trackCount: album.trackCount,
        artworkUrl: album.artworkUrl,
        userRating: rating || null,
        userNotes: notes.trim() || null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${album.title}`}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {album.title}
            </h2>
            <p className="truncate text-sm text-muted">{album.artistName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-faint hover:bg-raised hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <Field
            label="Your rating"
            htmlFor="rating"
            hint={rating ? `You rated this ${rating}/5.` : "No rating yet."}
          >
            <div id="rating" className="pt-1">
              <RatingStars value={rating} onChange={setRating} size={28} />
            </div>
          </Field>
          <Field
            label="Notes"
            htmlFor="notes"
            hint="Optional. Keep it to 2000 characters."
          >
            <Textarea
              id="notes"
              rows={4}
              placeholder="What does this one mean to you?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </Field>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function LibraryPage() {
  const { signOut } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Album | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Album | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAlbums(await api.getLibrary());
    } catch (err) {
      if (err instanceof Error && "status" in err && (err as { status: number }).status === 401) {
        signOut();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not load your library."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .getLibrary()
      .then((data) => {
        if (active) setAlbums(data);
      })
      .catch((err) => {
        if (!active) return;
        if (
          err instanceof Error &&
          "status" in err &&
          (err as { status: number }).status === 401
        ) {
          signOut();
          return;
        }
        setError(
          err instanceof Error ? err.message : "Could not load your library."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaved(updated: Album) {
    setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function handleDelete(album: Album) {
    setDeletingId(album.id);
    setActionError(null);
    try {
      await api.deleteAlbum(album.id);
      setAlbums((prev) => prev.filter((a) => a.id !== album.id));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete that album."
      );
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
              Your library
            </h1>
            <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted">
              {albums.length
                ? `${albums.length} album${albums.length === 1 ? "" : "s"} saved.`
                : "Nothing here yet."}
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-all duration-150 hover:bg-raised active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <MagnifyingGlass size={16} />
            Find more albums
          </Link>
        </div>

        {actionError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {actionError}
          </p>
        ) : null}

        <div className="mt-8" aria-live="polite">
          {loading ? <LibrarySkeleton /> : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-line bg-surface p-10 text-center">
              <p className="text-muted">{error}</p>
              <Button className="mt-4" onClick={load}>
                Try again
              </Button>
            </div>
          ) : null}

          {!loading && !error && albums.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
              <Books size={36} className="mx-auto text-faint" />
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                Your library is empty
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Search the catalog and save your first album — then rate it and
                leave a note.
              </p>
              <Link href="/search">
                <Button className="mt-6">Start searching</Button>
              </Link>
            </div>
          ) : null}

          {!loading && !error && albums.length > 0 ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              <AnimatePresence initial={false}>
                {albums.map((album) => (
                  <LibraryRow
                    key={album.id}
                    album={album}
                    onEdit={setEditing}
                    onDelete={setConfirmDelete}
                    deleting={deletingId === album.id}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : null}
        </div>

        <AnimatePresence>
          {editing ? (
            <EditModal
              album={editing}
              onClose={() => setEditing(null)}
              onSaved={handleSaved}
            />
          ) : null}

          {confirmDelete ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
              onClick={() => setConfirmDelete(null)}
              role="dialog"
              aria-modal="true"
              aria-label={`Delete ${confirmDelete.title}`}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6"
              >
                <h2 className="text-lg font-semibold tracking-tight">
                  Remove from library?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  “{confirmDelete.title}” by {confirmDelete.artistName} will be
                  deleted. This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Keep it
                  </Button>
                  <Button
                    variant="danger"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(confirmDelete)}
                  >
                    {deletingId === confirmDelete.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </RequireAuth>
  );
}
