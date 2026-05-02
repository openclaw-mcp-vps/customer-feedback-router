"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlockAccess() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/paywall/unlock", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to unlock access. Please try again.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unlock access");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10 md:px-8">
      <section className="section-card p-8 md:p-10">
        <h1 className="text-3xl font-semibold">Unlock your workspace</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
          If checkout is complete, click below to enable dashboard access on this device.
        </p>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={unlockAccess}
            disabled={loading}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Unlocking..." : "Unlock Dashboard"}
          </button>
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
          >
            Open Stripe Checkout
          </a>
        </div>
      </section>
    </main>
  );
}
