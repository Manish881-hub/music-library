"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { ChartBar, Sparkle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/AuthGate";
import { Button } from "@/components/ui/Button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.color = "#9c968a";
ChartJS.defaults.borderColor = "#2e2b25";
ChartJS.defaults.font.family = "var(--font-geist-sans), system-ui, sans-serif";

interface Insights {
  totalAlbums: number;
  topGenres: Record<string, number>;
  topArtists: Record<string, number>;
  ratedAlbums: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  releaseDecades: Record<string, number>;
  albumsAddedByMonth: Record<string, number>;
  summary: string;
}

const ACCENT = "#d97757";
const PALETTE = ["#d97757", "#6a9bcc", "#788c5d", "#b58a5a", "#8a6ba8", "#c96f6f"];
const MONTH_ORDER = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function cumulativeSeries(byMonth: Record<string, number>): number[] {
  const total = Object.values(byMonth).reduce((sum, n) => sum + n, 0);
  if (Object.keys(byMonth).length <= 1) return [0, total];
  let running = 0;
  return MONTH_ORDER.filter((m) => m in byMonth).map(
    (m) => (running += byMonth[m])
  );
}

function monthsWithData(byMonth: Record<string, number>): string[] {
  const keys = Object.keys(byMonth);
  if (keys.length <= 1) return ["Start", "Now"];
  return MONTH_ORDER.filter((m) => m in byMonth).map((m) => m.slice(0, 3));
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { signOut } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInsights();
      setInsights(data as unknown as Insights);
    } catch (err) {
      if (
        err instanceof Error &&
        "status" in err &&
        (err as { status: number }).status === 401
      ) {
        signOut();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .getInsights()
      .then((data) => {
        if (active) setInsights(data as unknown as Insights);
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
          err instanceof Error ? err.message : "Could not load your dashboard."
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

  const genreEntries = insights ? Object.entries(insights.topGenres).slice(0, 8) : [];
  const artistEntries = insights
    ? Object.entries(insights.topArtists).slice(0, 5)
    : [];
  const ratingEntries = insights
    ? [1, 2, 3, 4, 5]
        .map((r) => [String(r), insights.ratingDistribution[String(r)] ?? 0] as const)
        .filter(([, count]) => count > 0)
    : [];
  const decadeEntries = insights
    ? Object.entries(insights.releaseDecades)
    : [];

  const genreData = {
    labels: genreEntries.map(([g]) => g),
    datasets: [
      {
        label: "Albums",
        data: genreEntries.map(([, n]) => n),
        backgroundColor: ACCENT,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const artistData = {
    labels: artistEntries.map(([a]) => a),
    datasets: [
      {
        label: "Albums",
        data: artistEntries.map(([, n]) => n),
        backgroundColor: ACCENT,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const ratingData = {
    labels: ratingEntries.map(([r]) => `${r} star${r === "1" ? "" : "s"}`),
    datasets: [
      {
        data: ratingEntries.map(([, n]) => n),
        backgroundColor: PALETTE,
        borderColor: "#1c1a17",
        borderWidth: 2,
      },
    ],
  };

  const timelineData = {
    labels: insights ? monthsWithData(insights.albumsAddedByMonth) : [],
    datasets: [
      {
        label: "Total albums",
        data: insights ? cumulativeSeries(insights.albumsAddedByMonth) : [],
        borderColor: ACCENT,
        backgroundColor: "rgba(217, 119, 87, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: ACCENT,
      },
    ],
  };

  const decadeData = {
    labels: decadeEntries.map(([d]) => d),
    datasets: [
      {
        label: "Albums",
        data: decadeEntries.map(([, n]) => n),
        backgroundColor: PALETTE,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="skeleton h-8 w-64 rounded-full" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
              Your listening dashboard
            </h1>
            <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted">
              Trends computed from your saved library.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={load}>
            <ChartBar size={14} />
            Refresh
          </Button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        {insights && insights.totalAlbums === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
            <Sparkle size={36} className="mx-auto text-faint" />
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              No data to chart yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Save albums from Search and this dashboard will light up with
              genre, rating, and artist trends.
            </p>
          </div>
        ) : null}

        {insights && insights.totalAlbums > 0 ? (
          <>
            <div className="mt-8 rounded-2xl border border-accent/25 bg-accent-soft p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                <Sparkle size={14} weight="fill" />
                Trend summary
              </p>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink">
                {insights.summary}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Albums saved" value={insights.totalAlbums} />
              <StatTile
                label="Average rating"
                value={
                  insights.ratedAlbums
                    ? `${insights.averageRating.toFixed(1)} / 5`
                    : "—"
                }
              />
              <StatTile
                label="Rated albums"
                value={`${insights.ratedAlbums} / ${insights.totalAlbums}`}
              />
              <StatTile
                label="Top genre"
                value={genreEntries[0]?.[0] ?? "—"}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <ChartCard title="Albums per genre">
                <Bar
                  data={genreData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } } },
                  }}
                />
              </ChartCard>
              <ChartCard title="Rating distribution">
                <Doughnut
                  data={ratingData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: {
                      legend: { position: "bottom", labels: { boxWidth: 12 } },
                    },
                  }}
                />
              </ChartCard>
              <ChartCard title="Library growth">
                <Line
                  data={timelineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  }}
                />
              </ChartCard>
              <ChartCard title="Top artists">
                <Bar
                  data={artistData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } } },
                  }}
                />
              </ChartCard>
              <ChartCard title="Releases by decade">
                <Bar
                  data={decadeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  }}
                />
              </ChartCard>
            </div>
          </>
        ) : null}
      </div>
    </RequireAuth>
  );
}
