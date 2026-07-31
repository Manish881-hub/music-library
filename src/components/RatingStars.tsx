"use client";

import { Star } from "@phosphor-icons/react";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function RatingStars({ value, onChange, size = 20 }: RatingStarsProps) {
  if (!onChange) {
    return (
      <div className="flex items-center gap-1" aria-label={`Rated ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            weight={n <= value ? "fill" : "regular"}
            className={n <= value ? "text-accent" : "text-faint"}
          />
        ))}
        {value ? <span className="ml-1 text-sm text-muted">{value}</span> : null}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform active:scale-[0.9] focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Star
            size={size}
            weight={n <= value ? "fill" : "regular"}
            className={n <= value ? "text-accent" : "text-faint hover:text-muted"}
          />
        </button>
      ))}
    </div>
  );
}
