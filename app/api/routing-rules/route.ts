import { NextResponse } from "next/server";
import { z } from "zod";
import { listRoutingRules, saveRoutingRules } from "@/lib/database";

export const runtime = "nodejs";

const ruleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  enabled: z.boolean(),
  channel: z.enum(["email", "slack", "support-ticket", "web-form", "manual", "any"]).optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  keywords: z.array(z.string()),
  assignToTeamMemberId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

const payloadSchema = z.object({
  rules: z.array(ruleSchema).min(1)
});

export async function GET() {
  try {
    const rules = await listRoutingRules();
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load rules",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid rules payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const rules = await saveRoutingRules(parsed.data.rules);
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save rules",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
