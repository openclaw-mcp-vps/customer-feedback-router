import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyFeedback } from "@/lib/ai-classifier";

export const runtime = "nodejs";

const payloadSchema = z.object({
  channel: z.enum(["email", "slack", "support-ticket", "web-form", "manual"]),
  subject: z.string().optional(),
  message: z.string().min(10),
  customerContext: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const classification = await classifyFeedback(parsed.data);
    return NextResponse.json({ classification });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to classify feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
