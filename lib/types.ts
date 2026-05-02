export type FeedbackChannel = "email" | "slack" | "support-ticket" | "web-form" | "manual";

export type FeedbackCategory =
  | "bug-report"
  | "feature-request"
  | "billing"
  | "onboarding"
  | "support"
  | "praise"
  | "churn-risk"
  | "integration"
  | "security"
  | "other";

export type FeedbackUrgency = "low" | "medium" | "high" | "critical";

export type FeedbackSentiment = "positive" | "neutral" | "negative";

export type FeedbackStatus = "new" | "routed" | "in-progress" | "resolved";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  slackUserId?: string;
  roles: string[];
  skills: FeedbackCategory[];
  maxDailyLoad: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  channel?: FeedbackChannel | "any";
  category?: FeedbackCategory;
  urgency?: FeedbackUrgency;
  sentiment?: FeedbackSentiment;
  keywords: string[];
  assignToTeamMemberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRecord {
  id: string;
  channel: FeedbackChannel;
  customerName?: string;
  customerEmail?: string;
  subject?: string;
  message: string;
  category: FeedbackCategory;
  urgency: FeedbackUrgency;
  sentiment: FeedbackSentiment;
  confidence: number;
  summary: string;
  tags: string[];
  assignedTeamMemberId?: string;
  recommendedTeamMemberId?: string;
  matchedRuleId?: string;
  status: FeedbackStatus;
  sourceMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClassificationResult {
  category: FeedbackCategory;
  urgency: FeedbackUrgency;
  sentiment: FeedbackSentiment;
  confidence: number;
  summary: string;
  tags: string[];
  recommendedRole: string;
}

export interface RoutingDecision {
  assignedTeamMemberId?: string;
  matchedRuleId?: string;
  reason: string;
}
