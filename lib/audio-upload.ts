export const MAX_AUDIO_BYTES = 25_000_000;

export const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

export type AudioUploadValidationInput = {
  size: number;
  type?: string;
};

export type AudioUploadValidationResult =
  | {
      ok: true;
      mimeType: string;
      durationSeconds: number | null;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

export function validateAudioUpload(
  file: AudioUploadValidationInput,
  durationSecondsValue: FormDataEntryValue | null,
  maxVoiceRecordingSeconds: number,
): AudioUploadValidationResult {
  const durationSeconds =
    typeof durationSecondsValue === "string"
      ? Math.ceil(Number(durationSecondsValue))
      : null;

  if (
    durationSeconds !== null &&
    (!Number.isFinite(durationSeconds) || durationSeconds < 1)
  ) {
    return { ok: false, message: "Invalid recording duration" };
  }

  if (
    durationSeconds !== null &&
    durationSeconds > maxVoiceRecordingSeconds
  ) {
    return {
      ok: false,
      message: `Voice recordings on your plan must be ${maxVoiceRecordingSeconds} seconds or shorter`,
      status: 403,
    };
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return { ok: false, message: "Audio recording must be 25 MB or smaller" };
  }

  const mimeType = file.type || "audio/webm";
  if (!SUPPORTED_AUDIO_TYPES.has(mimeType)) {
    return { ok: false, message: "Unsupported audio format" };
  }

  return { ok: true, mimeType, durationSeconds };
}
