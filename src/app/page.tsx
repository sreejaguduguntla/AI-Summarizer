"use client";
import { useState } from "react";

export default function Page() {
  const [transcript, setTranscript] = useState("");
  const [instruction, setInstruction] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState("");

  async function handleTextFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
  }

  async function handleSummarize() {
    setLoading(true);
    setSummary("");
    setWarning("");
    setError("");

    if (!transcript.trim()) {
      setError("Please upload a file or paste a transcript.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, instruction }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Server returned an error");
        if (data.summary) setSummary(data.summary);
      } else {
        setSummary(data.summary || "");
        if (data.warning) setWarning(data.warning);
      }
    } catch (e: unknown) {
      const errorMessage =
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : "Network error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    setSendFeedback("");

    if (!email.trim() || !summary.trim()) {
      setSendFeedback("❌ Please enter a recipient email and ensure a summary is generated.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, summary }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendFeedback("❌ Failed: " + (data.error || "Server error"));
      } else {
        setSendFeedback("✅ Email sent successfully!");
        setEmail("");
      }
    } catch (e: unknown) {
      const errorMessage =
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : "Network error";
      setSendFeedback("❌ " + errorMessage);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI Meeting Notes Summarizer</h1>

      <div style={{ marginTop: 12 }}>
        <p>Upload a text file:</p>
        <input
          type="file"
          accept=".txt"
          onChange={handleTextFileUpload}
        />
      </div>

      <input
        placeholder="Instruction (e.g. Summarize in bullet points for executives)"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 12 }}
      />

      <textarea
        placeholder="Or paste transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={8}
        style={{ width: "100%", padding: 8, marginTop: 8, fontFamily: "monospace" }}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={handleSummarize} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "⏳ Generating Summary..." : "Generate Summary"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {warning && <p style={{ color: "orange", marginTop: 12 }}>{warning}</p>}

      {summary && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 6 }}>
          <h2>Summary</h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
          />
          <div style={{ marginTop: 12 }}>
            <input
              placeholder="Recipient email(s) (comma separated)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "70%", padding: 8 }}
            />
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              style={{ marginLeft: 8, padding: "8px 16px" }}
            >
              {isSending ? "⏳ Sending..." : "Share via Email"}
            </button>
          </div>
          {sendFeedback && (
            <p
              style={{
                color: sendFeedback.startsWith("✅") ? "green" : "red",
                marginTop: 8,
              }}
            >
              {sendFeedback}
            </p>
          )}
        </div>
      )}
    </main>
  );
}