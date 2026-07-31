export const RETENTION_POLICY = {
  cvFiles:
    "Stored privately until the user deletes the CV file or deletes their account.",
  extractedCvText:
    "Stored with the CV import so the user can review and re-extract without reuploading.",
  experiences:
    "Stored until the user deletes the experience or deletes their account.",
  practiceAudio:
    "Stored privately until the user deletes the recording or deletes their account.",
  practiceTranscripts:
    "Stored with the attempt after audio deletion so feedback history still works.",
  dictationAudio:
    "Voice dictation audio is processed for transcription and is not stored.",
  generatedContent:
    "Stored until the user deletes their account; edited versions preserve the original generated text.",
} as const;
