import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  Clock3,
  ShieldCheck
} from "lucide-react";

const faqs = [
  {
    question: "How does the router decide who gets each feedback item?",
    answer:
      "Each message is classified for category, urgency, and sentiment. Then custom routing rules are evaluated first; if no rule matches, load-aware team assignment is applied based on expertise and current queue size."
  },
  {
    question: "Can we ingest feedback from Slack, email, and support tools?",
    answer:
      "Yes. The webhook endpoint accepts payloads from multiple channels and normalizes each message into a single triage workflow so teams avoid fragmented queues."
  },
  {
    question: "Do we need to change our current support process?",
    answer:
      "No. You can start by forwarding one channel at a time, monitor routing accuracy in the dashboard, and tighten rules as your team learns which assignments work best."
  },
  {
    question: "What happens if the AI confidence is low?",
    answer:
      "Low-confidence items are still routed with an explanation and can be reviewed in the dashboard. Teams can quickly adjust rules to reduce repeat misroutes."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-8 md:px-8 md:py-12">
      <header className="section-card overflow-hidden p-8 md:p-12">
        <p className="inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
          Customer Success Workflow Automation
        </p>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Route customer feedback to the right team member in under 60 seconds.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
              Customer Feedback Router classifies incoming feedback with AI, applies
              transparent routing rules, and assigns the best owner before valuable
              context gets buried in inboxes and chat threads.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Start for $35/mo
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/5"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p className="font-semibold">Current pain:</p>
              <p className="mt-1 text-blue-200/90">
                Feedback gets triaged manually and routed late, slowing response times
                and hiding recurring product issues.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">Outcome with router:</p>
              <p className="mt-1 text-emerald-200/90">
                Every item receives structured metadata, a clear owner, and a
                measurable SLA path.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="section-card p-6">
          <Clock3 className="h-5 w-5 text-blue-300" />
          <h2 className="mt-4 text-xl font-semibold">Fix Slow Response Cycles</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Automatically classify urgency so high-risk feedback is surfaced to the
            right people before churn conversations escalate.
          </p>
        </article>
        <article className="section-card p-6">
          <BrainCircuit className="h-5 w-5 text-blue-300" />
          <h2 className="mt-4 text-xl font-semibold">AI + Rule Transparency</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Combine model-driven analysis with editable routing rules so your team can
            trust every assignment and refine logic quickly.
          </p>
        </article>
        <article className="section-card p-6">
          <ChartNoAxesCombined className="h-5 w-5 text-blue-300" />
          <h2 className="mt-4 text-xl font-semibold">Operational Visibility</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Monitor category mix, queue pressure, and assignment quality from a single
            dashboard used by support, CS, and product.
          </p>
        </article>
      </section>

      <section id="pricing" className="section-card p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold">Simple pricing for focused teams</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Designed for customer success and product teams that need dependable
              routing without enterprise setup overhead.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white/5 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Growth Plan
            </p>
            <p className="mt-2 text-4xl font-semibold">
              $35<span className="text-base font-medium text-[var(--text-secondary)]">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                AI feedback classification
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Multi-channel webhook ingestion
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Routing rules and team load balancing
              </li>
            </ul>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Buy with Stripe Checkout
            </a>
          </div>
        </div>
      </section>

      <section className="section-card p-8 md:p-10">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-5 w-5 text-blue-300" />
          Frequently Asked Questions
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-[var(--border)] bg-black/20 p-5">
              <h3 className="text-base font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
