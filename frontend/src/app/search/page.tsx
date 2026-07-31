"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { ApiError, ITunesResult } from "@/lib/types";
import { RequireAuth } from "@/components/AuthGate";
import {
  SearchResultCard,
  SearchResultSkeleton,
  useSaveToLibrary,
} from "@/components/SearchResultCard";

const DEBOUNCE_MS = 400;

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ITunesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { saved, savingId, error: saveError, save } = useSaveToLibrary(new Set());

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await api.search(query, "album", 12, controller.signal);
      setResults(data.results ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof ApiError ? err.message : "Search failed. Try again."
      );
      setResults([]);
    } finally {
      if (controller === abortRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    const timer = setTimeout(() => {
      if (!trimmed) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        setError(null);
        return;
      }
      runSearch(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
            Find something to keep
          </h1>
          <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted">
            Search the iTunes catalog, then save the albums worth coming back
            to.
          </p>
        </div>

        <div className="relative mt-8 max-w-2xl">
          <MagnifyingGlass
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Try “coldplay”, “jazz 1959”, or “parachutes”…"
            aria-label="Search albums"
            className="w-full rounded-2xl border border-line bg-surface py-4 pl-12 pr-11 text-base text-ink placeholder:text-faint transition-colors focus:border-accent focus:outline-2 focus:outline-offset-0 focus:outline-accent/40"
          />
          {term ? (
            <button
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-faint hover:bg-raised hover:text-ink"
            >
              <X size={18} />
            </button>
          ) : null}
          {loading ? (
            <span className="absolute right-12 top-1/2 -translate-y-1/2">
              <span className="skeleton h-2 w-16 rounded-full" aria-hidden />
            </span>
          ) : null}
        </div>

        {saveError ? (
          <p
            role="alert"
            className="mt-4 max-w-2xl rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {saveError}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-8" aria-live="polite">
          {!searched && !loading ? (
            <p className="text-sm text-faint">
              Start typing above — results appear as you search.
            </p>
          ) : null}

          {searched && !loading && !error && results.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing came back for “{term.trim()}”. Try a different spelling
              or an artist name.
            </p>
          ) : null}

          <ul
            className={`grid gap-4 ${results.length ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}`}
          >
            <AnimatePresence mode="popLayout">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SearchResultSkeleton key={`skeleton-${i}`} />
                  ))
                : results.map((result) => (
                    <SearchResultCard
                      key={result.collectionId}
                      result={result}
                      saved={saved.has(result.collectionId)}
                      busy={savingId === result.collectionId}
                      onSave={save}
                    />
                  ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </RequireAuth>
  );
}
