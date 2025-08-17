import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const transcription = await hf.automaticSpeechRecognition({
      data: audioFile,
      model: "openai/whisper-large-v3",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err: unknown) {
    const errorMessage = 
      typeof err === "object" && err !== null && "message" in err
        ? (err as { message: string }).message
        : "Internal server error during transcription";

    console.error("❌ /api/transcribe unexpected error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}