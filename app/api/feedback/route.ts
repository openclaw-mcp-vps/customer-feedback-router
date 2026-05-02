import { NextResponse } from "next/server";
import { listFeedback } from "@/lib/database";
import { feedbackInputSchema, processIncomingFeedback } from "@/lib/feedback-pipeline";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "200");
    const feedback = await listFeedback(Number.isFinite(limit) ? limit : 200);
    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid feedback payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const result = await processIncomingFeedback(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to ingest feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
