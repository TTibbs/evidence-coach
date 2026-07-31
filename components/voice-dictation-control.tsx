"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UsageSummary = {
  config?: {
    maxVoiceRecordingSeconds?: number;
    voicePractice?: boolean;
  };
};

type VoiceDictationControlProps = {
  onTranscript: (transcript: string) => void;
  endpoint?: string;
};

function isVoiceDictationSupported() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    "MediaRecorder" in window
  );
}

export function VoiceDictationControl({
  onTranscript,
  endpoint = "/api/transcribe",
}: VoiceDictationControlProps) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceLimitSeconds, setVoiceLimitSeconds] = useState<number | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSupported(isVoiceDictationSupported());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    async function loadUsage() {
      const res = await fetch("/api/usage");
      const data = (await res.json().catch(() => ({}))) as UsageSummary;
      if (!res.ok) return;

      if (data.config?.maxVoiceRecordingSeconds) {
        setVoiceLimitSeconds(data.config.maxVoiceRecordingSeconds);
      }
      if (data.config?.voicePractice === false) {
        setVoiceAvailable(false);
      }
    }

    loadUsage();
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (!supported) {
      toast.error("Voice dictation is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
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
        recorder.stream.getTracks().forEach((track) => track.stop());
        setRecording(false);

        const startedAt = recordingStartedAtRef.current;
        const durationSeconds = startedAt
          ? Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))
          : null;
        recordingStartedAtRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          toast.error("No audio was recorded");
          return;
        }

        setTranscribing(true);
        const form = new FormData();
        form.append("audio", blob, "dictation.webm");
        if (durationSeconds) {
          form.append("durationSeconds", String(durationSeconds));
        }

        const res = await fetch(endpoint, {
          method: "POST",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        setTranscribing(false);

        if (!res.ok) {
          toast.error(data.error || "Transcription failed");
          return;
        }

        onTranscript(data.transcript);
        toast.success("Transcript added. Review it before continuing");
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
    } catch (err) {
      const message =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Microphone permission was denied"
          : "Could not start voice dictation";
      toast.error(message);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  const disabled = !supported || !voiceAvailable || transcribing;
  const disabledReason = !supported
    ? "Voice dictation is not supported in this browser"
    : !voiceAvailable
      ? "Voice dictation is not available on your plan"
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!recording ? (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={disabled}
          title={disabledReason}
        >
          {transcribing ? "Transcribing..." : "Dictate answer"}
        </Button>
      ) : (
        <Button type="button" variant="destructive" onClick={stopRecording}>
          Stop dictation
        </Button>
      )}
      {recording && (
        <Badge variant="secondary">
          {recordingSeconds}s
          {voiceLimitSeconds ? ` / ${voiceLimitSeconds}s` : ""}
        </Badge>
      )}
      {transcribing && <Badge variant="warning">Creating transcript</Badge>}
      {disabledReason && <p className="text-sm text-stone-500">{disabledReason}</p>}
    </div>
  );
}
