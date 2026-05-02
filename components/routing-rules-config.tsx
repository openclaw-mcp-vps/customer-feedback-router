"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { RoutingRule, TeamMember } from "@/lib/types";

type NewRule = {
  name: string;
  channel: RoutingRule["channel"];
  category: RoutingRule["category"];
  urgency: RoutingRule["urgency"];
  sentiment: RoutingRule["sentiment"];
  keywords: string;
  assignToTeamMemberId: string;
};

const channelOptions: NonNullable<RoutingRule["channel"]>[] = [
  "any",
  "email",
  "slack",
  "support-ticket",
  "web-form",
  "manual"
];

const categoryOptions: NonNullable<RoutingRule["category"]>[] = [
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
];

const urgencyOptions: NonNullable<RoutingRule["urgency"]>[] = ["low", "medium", "high", "critical"];
const sentimentOptions: NonNullable<RoutingRule["sentiment"]>[] = ["positive", "neutral", "negative"];

export function RoutingRulesConfig() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newRule, setNewRule] = useState<NewRule>({
    name: "",
    channel: "any",
    category: undefined,
    urgency: undefined,
    sentiment: undefined,
    keywords: "",
    assignToTeamMemberId: ""
  });

  useEffect(() => {
    async function load() {
      try {
        const [rulesRes, membersRes] = await Promise.all([
          fetch("/api/routing-rules", { cache: "no-store" }),
          fetch("/api/team-members", { cache: "no-store" })
        ]);

        const rulesJson = await rulesRes.json();
        const membersJson = await membersRes.json();
        setRules(rulesJson.rules ?? []);
        setTeamMembers(membersJson.teamMembers ?? []);

        if ((membersJson.teamMembers?.length ?? 0) > 0) {
          setNewRule((prev) => ({
            ...prev,
            assignToTeamMemberId:
              prev.assignToTeamMemberId || membersJson.teamMembers[0].id
          }));
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function addRule() {
    if (!newRule.name.trim() || !newRule.assignToTeamMemberId) {
      setMessage("Rule name and assignee are required.");
      return;
    }

    const timestamp = new Date().toISOString();
    const rule: RoutingRule = {
      id: `rr-${crypto.randomUUID()}`,
      name: newRule.name.trim(),
      enabled: true,
      channel: newRule.channel,
      category: newRule.category,
      urgency: newRule.urgency,
      sentiment: newRule.sentiment,
      keywords: newRule.keywords
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean),
      assignToTeamMemberId: newRule.assignToTeamMemberId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setRules((prev) => [rule, ...prev]);
    setNewRule((prev) => ({
      ...prev,
      name: "",
      keywords: ""
    }));
    setMessage(null);
  }

  async function saveRules() {
    if (rules.length === 0) {
      setMessage("Create at least one rule before saving.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/routing-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rules })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save rules");
      }

      setRules(payload.rules ?? []);
      setMessage("Routing rules saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save rules");
    } finally {
      setSaving(false);
    }
  }

  function removeRule(ruleId: string) {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }

  return (
    <section className="section-card p-5">
      <h2 className="text-lg font-semibold">Routing Rules</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Rules are checked before load balancing. Put precise rules first.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading rules...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 rounded-lg border border-[var(--border)] bg-black/25 p-4">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Rule name</span>
              <input
                value={newRule.name}
                onChange={(event) => setNewRule((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                placeholder="Critical security alerts"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Channel</span>
                <select
                  value={newRule.channel ?? "any"}
                  onChange={(event) =>
                    setNewRule((prev) => ({ ...prev, channel: event.target.value as NewRule["channel"] }))
                  }
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
                <span className="text-[var(--text-secondary)]">Assign to</span>
                <select
                  value={newRule.assignToTeamMemberId}
                  onChange={(event) =>
                    setNewRule((prev) => ({ ...prev, assignToTeamMemberId: event.target.value }))
                  }
                  className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                >
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Category</span>
                <select
                  value={newRule.category ?? ""}
                  onChange={(event) =>
                    setNewRule((prev) => ({
                      ...prev,
                      category: (event.target.value || undefined) as NewRule["category"]
                    }))
                  }
                  className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                >
                  <option value="">Any</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Urgency</span>
                <select
                  value={newRule.urgency ?? ""}
                  onChange={(event) =>
                    setNewRule((prev) => ({
                      ...prev,
                      urgency: (event.target.value || undefined) as NewRule["urgency"]
                    }))
                  }
                  className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                >
                  <option value="">Any</option>
                  {urgencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Sentiment</span>
                <select
                  value={newRule.sentiment ?? ""}
                  onChange={(event) =>
                    setNewRule((prev) => ({
                      ...prev,
                      sentiment: (event.target.value || undefined) as NewRule["sentiment"]
                    }))
                  }
                  className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                >
                  <option value="">Any</option>
                  {sentimentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-[var(--text-secondary)]">Keyword triggers (comma-separated)</span>
              <input
                value={newRule.keywords}
                onChange={(event) => setNewRule((prev) => ({ ...prev, keywords: event.target.value }))}
                className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
                placeholder="breach, leak, vulnerability"
              />
            </label>

            <button
              type="button"
              onClick={addRule}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {rules.map((rule) => {
              const assignee = teamMembers.find((member) => member.id === rule.assignToTeamMemberId);
              return (
                <article key={rule.id} className="rounded-lg border border-[var(--border)] bg-black/25 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {rule.channel ?? "any"} • {rule.category ?? "any category"} • {rule.urgency ?? "any urgency"} •{" "}
                        {rule.sentiment ?? "any sentiment"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Assignee: {assignee ? `${assignee.name} (${assignee.email})` : rule.assignToTeamMemberId}
                      </p>
                      {rule.keywords.length > 0 ? (
                        <p className="mt-2 text-xs text-blue-200">Keywords: {rule.keywords.join(", ")}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="rounded-md border border-red-500/35 p-1.5 text-red-200 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void saveRules()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Rules"}
            </button>
            {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
          </div>
        </>
      )}
    </section>
  );
}
