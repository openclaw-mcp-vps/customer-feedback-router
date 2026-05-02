import Link from "next/link";
import { cookies } from "next/headers";
import { Lock, ShieldCheck } from "lucide-react";
import { FeedbackDashboard } from "@/components/feedback-dashboard";
import { RoutingRulesConfig } from "@/components/routing-rules-config";
import { TeamMemberSetup } from "@/components/team-member-setup";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("cfr_paid")?.value === "1";

  if (!hasAccess) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-4 py-10 md:px-8">
        <section className="section-card p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-yellow-200">
            <Lock className="h-3.5 w-3.5" />
            Paywalled Feature
          </div>
          <h1 className="mt-5 text-3xl font-semibold md:text-4xl">Unlock the feedback routing workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            The operational dashboard is available on the $35/mo plan. Complete checkout,
            then unlock access to the routing workspace on this device.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="inline-flex items-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Continue to Stripe Checkout
            </a>
            <Link
              href="/unlock"
              className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
            >
              I completed checkout
            </Link>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Access is stored via a secure cookie in your browser.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="section-card p-6 md:p-8">
        <h1 className="text-2xl font-semibold md:text-3xl">Customer Feedback Router Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] md:text-base">
          Track inbound feedback, tune routing rules, and keep ownership clear across
          customer success, product, and engineering.
        </p>
      </header>

      <FeedbackDashboard />

      <div className="grid gap-6 lg:grid-cols-2">
        <RoutingRulesConfig />
        <TeamMemberSetup />
      </div>
    </main>
  );
}
