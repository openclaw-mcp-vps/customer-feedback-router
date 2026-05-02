import { WebClient } from "@slack/web-api";
import { FeedbackRecord, TeamMember } from "@/lib/types";

export async function sendSlackRoutingAlert(
  feedback: FeedbackRecord,
  teamMember?: TeamMember
): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_ALERT_CHANNEL) {
    return { sent: false, reason: "Slack credentials are not configured." };
  }

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const urgencyEmoji =
    feedback.urgency === "critical"
      ? "🚨"
      : feedback.urgency === "high"
        ? "⚠️"
        : feedback.urgency === "medium"
          ? "🟡"
          : "🟢";

  const assigneeText = teamMember
    ? `${teamMember.name} (${teamMember.email})`
    : "No assignee determined";

  const text = [
    `${urgencyEmoji} *New feedback routed*`,
    `*Category:* ${feedback.category}`,
    `*Urgency:* ${feedback.urgency}`,
    `*Sentiment:* ${feedback.sentiment}`,
    `*Assigned to:* ${assigneeText}`,
    `*Summary:* ${feedback.summary}`,
    `*Message excerpt:* ${feedback.message.slice(0, 220)}`
  ].join("\n");

  try {
    await client.chat.postMessage({
      channel: process.env.SLACK_ALERT_CHANNEL,
      text
    });
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown Slack API error"
    };
  }
}
