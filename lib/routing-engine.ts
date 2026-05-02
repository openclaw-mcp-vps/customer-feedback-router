import { getOpenLoadByMember, listRoutingRules, listTeamMembers } from "@/lib/database";
import { ClassificationResult, FeedbackChannel, RoutingDecision } from "@/lib/types";

interface RouteInput extends ClassificationResult {
  channel: FeedbackChannel;
  subject?: string;
  message: string;
}

function keywordHits(text: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }
  return keywords.reduce((count, keyword) => {
    return text.includes(keyword.toLowerCase()) ? count + 1 : count;
  }, 0);
}

export async function routeFeedback(input: RouteInput): Promise<RoutingDecision> {
  const [rules, teamMembers, openLoad] = await Promise.all([
    listRoutingRules(),
    listTeamMembers(),
    getOpenLoadByMember()
  ]);

  const messageText = `${input.subject ?? ""} ${input.message}`.toLowerCase();

  const candidates = rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const channelMatch = !rule.channel || rule.channel === "any" || rule.channel === input.channel;
      const categoryMatch = !rule.category || rule.category === input.category;
      const urgencyMatch = !rule.urgency || rule.urgency === input.urgency;
      const sentimentMatch = !rule.sentiment || rule.sentiment === input.sentiment;
      const hits = keywordHits(messageText, rule.keywords);
      const keywordMatch = rule.keywords.length === 0 || hits > 0;

      const matched = channelMatch && categoryMatch && urgencyMatch && sentimentMatch && keywordMatch;
      const specificity =
        Number(Boolean(rule.channel && rule.channel !== "any")) +
        Number(Boolean(rule.category)) +
        Number(Boolean(rule.urgency)) +
        Number(Boolean(rule.sentiment)) +
        hits;

      return {
        rule,
        matched,
        score: specificity
      };
    })
    .filter((item) => item.matched)
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const chosen = candidates[0].rule;
    return {
      assignedTeamMemberId: chosen.assignToTeamMemberId,
      matchedRuleId: chosen.id,
      reason: `Matched rule \"${chosen.name}\" with category ${input.category} and urgency ${input.urgency}.`
    };
  }

  const activeTeamMembers = teamMembers.filter((member) => member.active);
  if (activeTeamMembers.length === 0) {
    return {
      reason: "No active team members found."
    };
  }

  const sortedMembers = activeTeamMembers
    .map((member) => {
      const load = openLoad[member.id] ?? 0;
      const skillBonus = member.skills.includes(input.category) ? 2 : 0;
      const roleBonus = member.roles.some((role) => role.includes(input.recommendedRole)) ? 1 : 0;
      const availabilityScore = 1 - Math.min(load / Math.max(member.maxDailyLoad, 1), 1);
      const score = skillBonus + roleBonus + availabilityScore;

      return {
        member,
        score
      };
    })
    .sort((a, b) => b.score - a.score);

  const winner = sortedMembers[0].member;
  return {
    assignedTeamMemberId: winner.id,
    reason: `No explicit rule matched. Assigned to ${winner.name} based on skills and active load.`
  };
}
