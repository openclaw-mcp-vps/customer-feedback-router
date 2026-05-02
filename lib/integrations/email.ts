import nodemailer from "nodemailer";
import { FeedbackRecord, TeamMember } from "@/lib/types";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

export async function sendRoutingEmail(
  feedback: FeedbackRecord,
  teamMember?: TeamMember
): Promise<{ sent: boolean; reason?: string }> {
  if (!teamMember) {
    return { sent: false, reason: "No team member to notify." };
  }

  const transporter = getTransporter();
  const from = process.env.ALERT_FROM_EMAIL;
  if (!transporter || !from) {
    return { sent: false, reason: "SMTP configuration is incomplete." };
  }

  try {
    await transporter.sendMail({
      from,
      to: teamMember.email,
      subject: `[Feedback Router] ${feedback.urgency.toUpperCase()} ${feedback.category}`,
      text: [
        `Hi ${teamMember.name},`,
        "",
        "A new customer feedback item has been routed to you:",
        `Category: ${feedback.category}`,
        `Urgency: ${feedback.urgency}`,
        `Sentiment: ${feedback.sentiment}`,
        `Confidence: ${Math.round(feedback.confidence * 100)}%`,
        `Summary: ${feedback.summary}`,
        "",
        `Customer: ${feedback.customerName ?? "Unknown"} (${feedback.customerEmail ?? "No email"})`,
        `Source: ${feedback.channel}`,
        "",
        `Message:\n${feedback.message}`,
        "",
        "Please follow up as soon as possible."
      ].join("\n")
    });
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown SMTP error"
    };
  }
}
