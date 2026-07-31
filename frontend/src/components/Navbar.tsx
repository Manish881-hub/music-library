"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Books, ChartBar, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/search", label: "Search", icon: MagnifyingGlass },
  { href: "/library", label: "Library", icon: Books },
  { href: "/dashboard", label: "Dashboard", icon: ChartBar },
];

export function Navbar() {
  const { status, email, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (status !== "authed") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/search" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Books size={18} weight="duotone" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Resonance
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-raised text-ink"
                    : "text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <div className="mx-2 h-5 w-px bg-line" aria-hidden />
          <span className="hidden max-w-40 truncate px-1 text-xs text-faint md:inline">
            {email}
          </span>
          <button
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            aria-label="Sign out"
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <SignOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
