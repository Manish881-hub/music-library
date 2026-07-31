"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { RedirectIfAuthed } from "@/components/AuthGate";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.login(email.trim(), password);
      signIn(res.token, res.email);
      router.replace("/search");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RedirectIfAuthed>
      <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
        <aside
          className="relative hidden lg:block"
          aria-hidden
          style={{
            backgroundImage: "url(/assets/images/vinyl-pattern.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
          <div className="absolute bottom-12 left-12 max-w-md">
            <p className="text-3xl font-semibold tracking-tight">
              Your music, kept.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Search the iTunes catalog, build a library of albums you love, and
              rate them on your terms.
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <h1 className="text-3xl font-semibold tracking-tighter">
              Welcome back
            </h1>
            <p className="mt-2 text-base text-muted">
              Sign in to get to your library.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              New to Resonance?{" "}
              <Link
                href="/register"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Create an account
              </Link>
            </p>
          </motion.div>
        </section>
      </div>
    </RedirectIfAuthed>
  );
}
