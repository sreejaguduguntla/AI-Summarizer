import { NextResponse } from "next/server";
import { Ollama } from "ollama";

export const runtime = "nodejs";

const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, instruction } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const prompt = instruction
      ? `${instruction}: ${transcript}`
      : `Summarize the following meeting notes: ${transcript}`;

    const modelName = "mistral:latest";

    const models = await ollama.list();
    const isModelAvailable = models.models.some(
      (m) => m.name === modelName
    );
    if (!isModelAvailable) {
      return NextResponse.json(
        {
          error: `Model '${modelName}' is not available. Please run 'ollama pull ${modelName}'`,
        },
        { status: 404 }
      );
    }

    const response = await ollama.generate({
      model: modelName,
      prompt: prompt,
      stream: false,
    });

    return NextResponse.json({ summary: response.response });
  } catch (err: any) {
    console.error("❌ /api/summary unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}