import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

// This is the new API route to handle audio file uploads and transcription
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Save the file to a temporary location
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp-audio-${Date.now()}.mp3`);
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await fs.writeFile(tempFilePath, audioBuffer);

    // Run the whisper command-line tool to transcribe the audio
    const whisperCommand = `whisper "${tempFilePath}" --model base.en --output_format txt`;

    return new Promise((resolve) => {
      exec(whisperCommand, async (error, stdout, stderr) => {
        await fs.unlink(tempFilePath).catch(console.error);

        if (error) {
          console.error(`Whisper exec error: ${error.message}`);
          return resolve(NextResponse.json({ error: `Transcription failed: ${error.message}` }, { status: 500 }));
        }
        if (stderr) {
          console.error(`Whisper stderr: ${stderr}`);
        }

        const transcriptFilePath = path.join(tempDir, `${path.parse(tempFilePath).name}.txt`);
        let transcriptText = "";
        try {
          transcriptText = await fs.readFile(transcriptFilePath, "utf-8");
          await fs.unlink(transcriptFilePath).catch(console.error);
        } catch (readError) {
          console.error(`Error reading transcript file: ${readError}`);
          return resolve(NextResponse.json({ error: "Failed to read transcribed text" }, { status: 500 }));
        }

        resolve(NextResponse.json({ transcript: transcriptText.trim() }));
      });
    });
  } catch (err: any) {
    console.error("❌ /api/transcribe unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 }
    );
  }
}