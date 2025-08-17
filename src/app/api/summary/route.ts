import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, instruction } = body;

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Groq API key is not set" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    const prompt = instruction
      ? `${instruction}: ${transcript}`
      : `Summarize the following meeting notes: ${transcript}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
    });

    const summary = chatCompletion.choices[0]?.message?.content || "";
    
    return NextResponse.json({ summary: summary });
  } catch (err: unknown) {
    const errorMessage = 
      typeof err === "object" && err !== null && "message" in err
        ? (err as { message: string }).message
        : "Internal server error";

    console.error("❌ /api/summary unexpected error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}