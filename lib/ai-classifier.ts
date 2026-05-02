import OpenAI from "openai";
import { z } from "zod";
import { ClassificationResult, FeedbackChannel } from "@/lib/types";

const classificationSchema = z.object({
  category: z.enum([
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
  ]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(8),
  tags: z.array(z.string().min(2)).max(8),
  recommendedRole: z.string().min(3)
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface ClassifyInput {
  channel: FeedbackChannel;
  subject?: string;
  message: string;
  customerContext?: string;
}

function fallbackClassifier(input: ClassifyInput): ClassificationResult {
  const text = `${input.subject ?? ""} ${input.message}`.toLowerCase();

  const rules: Array<{
    category: ClassificationResult["category"];
    role: string;
    keywords: string[];
    urgency?: ClassificationResult["urgency"];
  }> = [
    {
      category: "security",
      role: "engineering",
      keywords: ["breach", "vulnerability", "security", "leak", "hack"],
      urgency: "critical"
    },
    {
      category: "billing",
      role: "finance",
      keywords: ["refund", "invoice", "charged", "billing", "subscription"]
    },
    {
      category: "bug-report",
      role: "engineering",
      keywords: ["bug", "error", "broken", "crash", "issue", "does not work"]
    },
    {
      category: "feature-request",
      role: "product-manager",
      keywords: ["feature", "request", "roadmap", "wish", "improvement"]
    },
    {
      category: "onboarding",
      role: "customer-success",
      keywords: ["setup", "onboarding", "getting started", "training"]
    },
    {
      category: "integration",
      role: "engineering",
      keywords: ["api", "integrate", "webhook", "sync", "slack", "salesforce"]
    },
    {
      category: "churn-risk",
      role: "customer-success",
      keywords: ["cancel", "switching", "leaving", "too expensive", "unhappy"]
    },
    {
      category: "praise",
      role: "customer-success",
      keywords: ["love", "great", "excellent", "thanks", "amazing"]
    }
  ];

  const match = rules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  const sentiment =
    /love|great|excellent|amazing|thank/.test(text)
      ? "positive"
      : /angry|bad|broken|frustrated|cancel|refund/.test(text)
        ? "negative"
        : "neutral";
  const urgency = match?.urgency
    ? match.urgency
    : /urgent|asap|critical|immediately/.test(text)
      ? "high"
      : /today|soon|blocking/.test(text)
        ? "medium"
        : "low";

  const category = match?.category ?? "support";

  return {
    category,
    urgency,
    sentiment,
    confidence: match ? 0.78 : 0.56,
    summary:
      input.message.length > 180
        ? `${input.message.slice(0, 177).trim()}...`
        : input.message,
    tags: Array.from(
      new Set(
        [input.channel, category, urgency, sentiment]
          .map((tag) => tag.replace(/\s+/g, "-"))
          .filter(Boolean)
      )
    ),
    recommendedRole: match?.role ?? "customer-success"
  };
}

export async function classifyFeedback(input: ClassifyInput): Promise<ClassificationResult> {
  if (!openai) {
    return fallbackClassifier(input);
  }

  try {
    const prompt = [
      `Channel: ${input.channel}`,
      `Subject: ${input.subject ?? "(none)"}`,
      `Message: ${input.message}`,
      `Customer context: ${input.customerContext ?? "(none)"}`
    ].join("\n");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You classify SaaS customer feedback and return valid JSON matching the provided schema. Keep summaries practical for support triage."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "feedback_classification",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: {
                type: "string",
                enum: [
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
                ]
              },
              urgency: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              summary: {
                type: "string",
                minLength: 8
              },
              tags: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "string"
                }
              },
              recommendedRole: {
                type: "string",
                minLength: 3
              }
            },
            required: [
              "category",
              "urgency",
              "sentiment",
              "confidence",
              "summary",
              "tags",
              "recommendedRole"
            ]
          }
        }
      }
    });

    const raw = response.output_text;
    if (!raw) {
      return fallbackClassifier(input);
    }

    const parsed = classificationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return fallbackClassifier(input);
    }

    return parsed.data;
  } catch {
    return fallbackClassifier(input);
  }
}
