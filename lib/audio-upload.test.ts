import { describe, expect, it } from "vitest";
import { MAX_AUDIO_BYTES, validateAudioUpload } from "@/lib/audio-upload";

describe("validateAudioUpload", () => {
  it("accepts supported audio files", () => {
    const result = validateAudioUpload(
      { size: 1024, type: "audio/webm" },
      "12.2",
      120,
    );

    expect(result).toEqual({
      ok: true,
      mimeType: "audio/webm",
      durationSeconds: 13,
    });
  });

  it("defaults missing file type to webm", () => {
    const result = validateAudioUpload({ size: 1024 }, null, 120);

    expect(result).toEqual({
      ok: true,
      mimeType: "audio/webm",
      durationSeconds: null,
    });
  });

  it("rejects unsupported audio types", () => {
    const result = validateAudioUpload(
      { size: 1024, type: "text/plain" },
      null,
      120,
    );

    expect(result).toMatchObject({
      ok: false,
      message: "Unsupported audio format",
    });
  });

  it("rejects over-limit audio files", () => {
    const result = validateAudioUpload(
      { size: MAX_AUDIO_BYTES + 1, type: "audio/webm" },
      null,
      120,
    );

    expect(result).toMatchObject({
      ok: false,
      message: "Audio recording must be 25 MB or smaller",
    });
  });

  it("rejects invalid recording durations", () => {
    const result = validateAudioUpload(
      { size: 1024, type: "audio/webm" },
      "nope",
      120,
    );

    expect(result).toMatchObject({
      ok: false,
      message: "Invalid recording duration",
    });
  });

  it("rejects recordings longer than the plan limit", () => {
    const result = validateAudioUpload(
      { size: 1024, type: "audio/webm" },
      "121",
      120,
    );

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      message: "Voice recordings on your plan must be 120 seconds or shorter",
    });
  });
});
