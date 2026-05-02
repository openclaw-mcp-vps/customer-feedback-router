import { NextResponse } from "next/server";
import { z } from "zod";
import { listTeamMembers, upsertTeamMember } from "@/lib/database";

export const runtime = "nodejs";

const payloadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  slackUserId: z.string().optional(),
  roles: z.array(z.string().min(2)).min(1),
  skills: z.array(
    z.enum([
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
  ),
  maxDailyLoad: z.number().int().min(1).max(200),
  active: z.boolean()
});

export async function GET() {
  try {
    const teamMembers = await listTeamMembers();
    return NextResponse.json({ teamMembers });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load team members",
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
          error: "Invalid team member payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const member = await upsertTeamMember(parsed.data);
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save team member",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
