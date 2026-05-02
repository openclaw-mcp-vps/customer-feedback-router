"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { TeamMember } from "@/lib/types";

const validCategories = [
  "bug-report",
  "feature-request",
  "billing",
  "onboarding",
  "support",
  "praise",
  "churn-risk",
  "integration",
  "security",
  "other"
] as const;

export function TeamMemberSetup() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    slackUserId: "",
    roles: "customer-success",
    skills: "support,onboarding",
    maxDailyLoad: "25",
    active: true
  });

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await fetch("/api/team-members", { cache: "no-store" });
      const payload = await response.json();
      setTeamMembers(payload.teamMembers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const roles = form.roles
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const skills = form.skills
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is (typeof validCategories)[number] =>
          validCategories.includes(value as (typeof validCategories)[number])
        );

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        slackUserId: form.slackUserId.trim() || undefined,
        roles,
        skills,
        maxDailyLoad: Number(form.maxDailyLoad),
        active: form.active
      };

      const response = await fetch("/api/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to add team member");
      }

      setMessage("Team member saved.");
      setForm({
        name: "",
        email: "",
        slackUserId: "",
        roles: "customer-success",
        skills: "support,onboarding",
        maxDailyLoad: "25",
        active: true
      });
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section-card p-5">
      <h2 className="text-lg font-semibold">Team Members</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Define owners and skills so routing fallback chooses the right person.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={addMember}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              placeholder="Casey Evans"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              placeholder="casey@company.com"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">Slack User ID</span>
            <input
              value={form.slackUserId}
              onChange={(event) => setForm((prev) => ({ ...prev, slackUserId: event.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              placeholder="U12345ABC"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">Max Daily Load</span>
            <input
              type="number"
              min={1}
              value={form.maxDailyLoad}
              onChange={(event) => setForm((prev) => ({ ...prev, maxDailyLoad: event.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              required
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-[var(--text-secondary)]">Roles (comma-separated)</span>
          <input
            value={form.roles}
            onChange={(event) => setForm((prev) => ({ ...prev, roles: event.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
            placeholder="customer-success,product-manager"
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-[var(--text-secondary)]">Skills (comma-separated categories)</span>
          <input
            value={form.skills}
            onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
            placeholder="support,onboarding,feature-request"
            required
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          Team member is currently active for routing
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? "Saving..." : "Add Team Member"}
          </button>
          {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
        </div>
      </form>

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading team members...</p>
        ) : (
          teamMembers.map((member) => (
            <article
              key={member.id}
              className="rounded-lg border border-[var(--border)] bg-black/25 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{member.email}</p>
                </div>
                <span className="rounded-md bg-white/5 px-2 py-1 text-xs">
                  Capacity: {member.maxDailyLoad}/day
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">Roles: {member.roles.join(", ")}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Skills: {member.skills.join(", ")}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
