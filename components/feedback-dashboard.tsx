"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  RefreshCcw,
  SendHorizonal,
  ShieldAlert
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FeedbackRecord, FeedbackChannel, TeamMember } from "@/lib/types";

interface FeedbackResponse {
  feedback: FeedbackRecord[];
}

interface TeamMembersResponse {
  teamMembers: TeamMember[];
}

const channelOptions: FeedbackChannel[] = [
  "email",
  "slack",
  "support-ticket",
  "web-form",
  "manual"
];

const statusColorMap: Record<string, string> = {
  new: "#f85149",
  routed: "#2f81f7",
  "in-progress": "#d29922",
  resolved: "#2ea043"
};

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    channel: "manual" as FeedbackChannel,
    customerName: "",
    customerEmail: "",
    subject: "",
    message: ""
  });

  async function loadDashboardData() {
    try {
      setError(null);
      const [feedbackRes, teamRes] = await Promise.all([
        fetch("/api/feedback?limit=200", { cache: "no-store" }),
        fetch("/api/team-members", { cache: "no-store" })
      ]);

      if (!feedbackRes.ok || !teamRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const feedbackJson = (await feedbackRes.json()) as FeedbackResponse;
      const teamJson = (await teamRes.json()) as TeamMembersResponse;

      setFeedback(feedbackJson.feedback ?? []);
      setTeamMembers(teamJson.teamMembers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown dashboard error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
    const interval = setInterval(() => {
      void loadDashboardData();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const teamMemberMap = useMemo(() => {
    return teamMembers.reduce<Record<string, TeamMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [teamMembers]);

  const statusData = useMemo(() => {
    const counts = feedback.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [feedback]);

  const categoryData = useMemo(() => {
    const counts = feedback.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [feedback]);

  const metrics = useMemo(() => {
    const total = feedback.length;
    const critical = feedback.filter((item) => item.urgency === "critical").length;
    const unresolved = feedback.filter((item) => item.status !== "resolved").length;
    const routed = feedback.filter((item) => item.status === "routed").length;

    return {
      total,
      critical,
      unresolved,
      routed
    };
  }, [feedback]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/webhooks/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to submit feedback");
      }

      setForm({
        channel: "manual",
        customerName: "",
        customerEmail: "",
        subject: "",
        message: ""
      });
      setSubmitMessage("Feedback ingested and routed successfully.");
      void loadDashboardData();
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="section-card p-6">
        <p className="text-sm text-[var(--text-secondary)]">Loading feedback dashboard...</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="section-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Total Feedback</p>
            <Inbox className="h-4 w-4 text-blue-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold">{metrics.total}</p>
        </article>
        <article className="section-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Critical</p>
            <ShieldAlert className="h-4 w-4 text-red-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-red-200">{metrics.critical}</p>
        </article>
        <article className="section-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Unresolved</p>
            <AlertTriangle className="h-4 w-4 text-yellow-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-yellow-100">{metrics.unresolved}</p>
        </article>
        <article className="section-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Routed</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-emerald-200">{metrics.routed}</p>
        </article>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="section-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Feedback by Category</h2>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs transition hover:bg-white/5"
            >
              <RefreshCcw className="h-3 w-3" />
              Refresh
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: 10, right: 12, top: 6, bottom: 6 }}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="value" fill="#2f81f7" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="section-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Queue Status Mix</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={statusColorMap[entry.name] ?? "#2f81f7"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="section-card p-5">
        <h2 className="text-lg font-semibold">Submit feedback for routing</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Use this form to test classification and routing rules before wiring external webhooks.
        </p>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Channel</span>
              <select
                value={form.channel}
                onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value as FeedbackChannel }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Subject</span>
              <input
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                placeholder="Checkout keeps failing after payment"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Customer Name</span>
              <input
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                placeholder="Taylor Morgan"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Customer Email</span>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                placeholder="taylor@northwind.com"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">Feedback message</span>
            <textarea
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              className="min-h-28 rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              placeholder="Your latest Slack integration update broke our support workflows. This is urgent because our team cannot sync incident updates."
              required
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <SendHorizonal className="h-4 w-4" />
              {submitting ? "Routing..." : "Classify and Route"}
            </button>
            {submitMessage ? (
              <p className="text-sm text-[var(--text-secondary)]">{submitMessage}</p>
            ) : null}
          </div>
        </form>
      </article>

      <article className="section-card overflow-hidden p-5">
        <h2 className="text-lg font-semibold">Recent routed feedback</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Urgency</th>
                <th className="px-2 py-2">Assignee</th>
                <th className="px-2 py-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              {feedback.slice(0, 16).map((item) => {
                const assignee = item.assignedTeamMemberId
                  ? teamMemberMap[item.assignedTeamMemberId]
                  : undefined;

                return (
                  <tr key={item.id} className="border-b border-[var(--border)]/60 align-top">
                    <td className="px-2 py-2 text-[var(--text-secondary)]">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs">{item.category}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-md px-2 py-1 text-xs"
                        style={{
                          backgroundColor:
                            item.urgency === "critical"
                              ? "rgba(248,81,73,0.2)"
                              : item.urgency === "high"
                                ? "rgba(210,153,34,0.2)"
                                : "rgba(47,129,247,0.16)"
                        }}
                      >
                        {item.urgency}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {assignee ? (
                        <div>
                          <p>{assignee.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{assignee.email}</p>
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Unassigned</span>
                      )}
                    </td>
                    <td className="max-w-lg px-2 py-2 text-[var(--text-secondary)]">{item.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
