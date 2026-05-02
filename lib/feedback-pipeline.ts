import { z } from "zod";
import { classifyFeedback } from "@/lib/ai-classifier";
import { createFeedback, listTeamMembers } from "@/lib/database";
import { sendRoutingEmail } from "@/lib/integrations/email";
import { sendSlackRoutingAlert } from "@/lib/integrations/slack";
import { routeFeedback } from "@/lib/routing-engine";
import { FeedbackChannel } from "@/lib/types";

export const feedbackInputSchema = z.object({
  channel: z.enum(["email", "slack", "support-ticket", "web-form", "manual"]),
  customerName: z.string().trim().min(1).optional(),
  customerEmail: z.string().email().optional(),
  subject: z.string().trim().min(2).max(200).optional(),
  message: z.string().trim().min(10).max(10000),
  sourceMetadata: z.record(z.unknown()).optional(),
  customerContext: z.string().trim().max(500).optional()
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export async function processIncomingFeedback(input: FeedbackInput) {
  const classification = await classifyFeedback({
    channel: input.channel as FeedbackChannel,
    subject: input.subject,
    message: input.message,
    customerContext: input.customerContext
  });

  const decision = await routeFeedback({
    channel: input.channel as FeedbackChannel,
    subject: input.subject,
    message: input.message,
    ...classification
  });

  const feedback = await createFeedback({
    channel: input.channel,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject: input.subject,
    message: input.message,
    category: classification.category,
    urgency: classification.urgency,
    sentiment: classification.sentiment,
    confidence: classification.confidence,
    summary: classification.summary,
    tags: classification.tags,
    assignedTeamMemberId: decision.assignedTeamMemberId,
    recommendedTeamMemberId: decision.assignedTeamMemberId,
    matchedRuleId: decision.matchedRuleId,
    status: decision.assignedTeamMemberId ? "routed" : "new",
    sourceMetadata: {
      ...input.sourceMetadata,
      routingReason: decision.reason
    }
  });

  const teamMembers = await listTeamMembers();
  const assignee = teamMembers.find((member) => member.id === feedback.assignedTeamMemberId);

  const [slackDelivery, emailDelivery] = await Promise.all([
    sendSlackRoutingAlert(feedback, assignee),
    sendRoutingEmail(feedback, assignee)
  ]);

  return {
    feedback,
    classification,
    routingDecision: decision,
    notifications: {
      slack: slackDelivery,
      email: emailDelivery
    }
  };
}
