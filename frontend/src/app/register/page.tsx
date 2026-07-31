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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.register(email.trim(), password);
      signIn(res.token, res.email);
      router.replace("/search");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? "That email is already registered. Try signing in."
            : err.message
        );
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <RedirectIfAuthed>
      <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
        <section className="flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <h1 className="text-3xl font-semibold tracking-tighter">
              Build your library
            </h1>
            <p className="mt-2 text-base text-muted">
              Create an account — it takes ten seconds.
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
              <Field
                label="Password"
                htmlFor="password"
                hint="At least 6 characters."
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm password" htmlFor="confirm">
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                {busy ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </section>

        <aside
          className="relative hidden lg:block"
          aria-hidden
          style={{
            backgroundImage: "url(/assets/images/vinyl-pattern.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-transparent" />
          <div className="absolute right-12 top-12 max-w-md text-right">
            <p className="text-3xl font-semibold tracking-tight">
              Rate what you remember.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Five stars, honest notes, and a collection that tells the story of
              what you actually listen to.
            </p>
          </div>
        </aside>
      </div>
    </RedirectIfAuthed>
  );
}
