import { NextResponse } from "next/server";
import { feedbackInputSchema, processIncomingFeedback } from "@/lib/feedback-pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = feedbackInputSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid webhook payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const result = await processIncomingFeedback(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        result
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
