import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, summary } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email recipient is required" },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "AI Meeting Notes Summary",
      html: `
        <p>Hello,</p>
        <p>Here is the summary of your meeting notes:</p>
        <pre>${summary}</pre>
        <p>Best regards,</p>
        <p>The AI Summarizer</p>
      `,
    });

    if (data.error) {
      console.error("Resend API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ /api/send-email unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}