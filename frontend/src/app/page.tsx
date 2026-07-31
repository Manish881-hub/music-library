"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/search");
    else if (status === "guest") router.replace("/login");
  }, [status, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <span className="skeleton h-6 w-48 rounded-full" />
    </div>
  );
}
