"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Attempt = {
  id: string;
  answer_text: string;
  scores: Record<string, number>;
  feedback: {
    strengths: string[];
    improvements: string[];
    tryAgain: string[];
    evidenceComparison: { used: string[]; missed: string[] };
    summary: string;
  };
  structure_breakdown?: {
    contextPercentage: number;
    actionPercentage: number;
    outcomePercentage: number;
  } | null;
  attempt_number: number;
  audio_path?: string | null;
};

type Session = {
  id: string;
  question: string;
  mode: "text" | "voice";
  evidence_cards?: { title?: string; summary?: string } | null;
  practice_attempts: Attempt[];
};

type UsageSummary = {
  config?: {
    maxVoiceRecordingSeconds?: number;
  };
};

export default function PracticeSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceLimitSeconds, setVoiceLimitSeconds] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null);
  const [transcriptReview, setTranscriptReview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);

  async function load() {
    const res = await fetch(`/api/practice/sessions/${id}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Session not found");
      return;
    }
    setSession(data.session);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when session id changes
  }, [id]);

  useEffect(() => {
    async function loadUsage() {
      const res = await fetch("/api/usage");
      const data = (await res.json().catch(() => ({}))) as UsageSummary;
      if (res.ok && data.config?.maxVoiceRecordingSeconds) {
        setVoiceLimitSeconds(data.config.maxVoiceRecordingSeconds);
      }
    }

    loadUsage();
  }, []);

  async function playQuestion() {
    if (!session) return;
    const res = await fetch("/api/practice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: session.question }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not play question");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    setAudioDurationSeconds(null);
    setRecordingSeconds(0);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (autoStopRef.current) {
        window.clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
      const startedAt = recordingStartedAtRef.current;
      const durationSeconds = startedAt
        ? Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))
        : null;
      recordingStartedAtRef.current = null;
      setAudioDurationSeconds(durationSeconds);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      form.append("sessionId", id);
      if (durationSeconds) {
        form.append("durationSeconds", String(durationSeconds));
      }
      const res = await fetch("/api/practice/transcribe", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Transcription failed");
        return;
      }
      setAnswer(data.transcript);
      setAudioPath(data.audioPath);
      setAudioDurationSeconds(data.durationSeconds ?? durationSeconds);
      setTranscriptReview(true);
      toast.success("Review your transcript before analysing");
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    recordingStartedAtRef.current = Date.now();
    recordingTimerRef.current = window.setInterval(() => {
      if (!recordingStartedAtRef.current) return;
      setRecordingSeconds(
        Math.floor((Date.now() - recordingStartedAtRef.current) / 1000),
      );
    }, 500);
    if (voiceLimitSeconds) {
      autoStopRef.current = window.setTimeout(() => {
        toast.info("Recording limit reached");
        stopRecording();
      }, voiceLimitSeconds * 1000);
    }
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function submitAnswer() {
    if (!answer.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/practice/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: id,
        answerText: answer.trim(),
        audioPath,
        durationSeconds: audioDurationSeconds,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error || "Analysis failed");
      return;
    }
    toast.success("Feedback ready");
    setAnswer("");
    setAudioPath(null);
    setTranscriptReview(false);
    await load();
    router.push(`/practice/${id}/feedback?attempt=${data.attempt.id}`);
  }

  if (!session) return <p className="text-stone-600">Loading session…</p>;

  const latest = session.practice_attempts.at(-1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-2">
          {session.mode}
        </Badge>
        <h1 className="font-display text-3xl text-teal-950">Practice session</h1>
        <p className="mt-2 text-lg text-stone-800">{session.question}</p>
        {session.evidence_cards?.title && (
          <p className="mt-1 text-sm text-stone-500">
            Evidence: {session.evidence_cards.title}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={playQuestion}>
          Play question
        </Button>
        {session.practice_attempts.length >= 2 && (
          <Button variant="secondary" render={<Link href={`/practice/${id}/compare`} />}>
            Compare attempts
          </Button>
        )}
        {latest && (
          <Button variant="ghost" render={<Link href={`/practice/${id}/feedback?attempt=${latest.id}`} />}>
            Latest feedback
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {latest ? `Attempt ${(latest.attempt_number ?? 0) + 1}` : "Your answer"}
          </CardTitle>
        <CardDescription>
            {session.mode === "voice"
              ? `Record, review the transcript, then submit for feedback.${
                  voiceLimitSeconds
                    ? ` Recording limit: ${Math.floor(voiceLimitSeconds / 60)} minutes.`
                    : ""
                }`
              : "Write your answer, then submit for evidence-based feedback."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.mode === "voice" && (
            <div className="flex gap-2">
              {!recording ? (
                <Button type="button" onClick={startRecording}>
                  Start recording
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopRecording}>
                  Stop recording
                </Button>
              )}
              {transcriptReview && (
                <Badge variant="warning">Review transcript before analyse</Badge>
              )}
              {recording && (
                <Badge variant="secondary">
                  {recordingSeconds}s
                  {voiceLimitSeconds ? ` / ${voiceLimitSeconds}s` : ""}
                </Badge>
              )}
            </div>
          )}
          <Textarea
            rows={8}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer…"
            aria-label="Practice answer"
          />
          <Button onClick={submitAnswer} disabled={submitting || !answer.trim()}>
            {submitting ? "Analysing…" : "Submit for feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
