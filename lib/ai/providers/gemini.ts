import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  getGeminiApiKey,
  getGeminiModel,
} from "@/lib/ai/config";
import {
  AiProviderError,
  mapProviderFailure,
} from "@/lib/ai/errors";
import type {
  AnalyseJobDescriptionInput,
  AnalysePracticeAnswerInput,
  CareerAiProvider,
  CreateEvidenceCardInput,
  DecideNextQuestionInput,
  ExtractCvInput,
  GenerateCareerContentInput,
  GeneratePracticeQuestionInput,
  ImproveResponsibilitiesInput,
  SuggestEvidenceQuestionsInput,
  TranscribeAudioInput,
} from "@/lib/ai/provider";
import {
  CV_EXTRACT_SYSTEM,
  EVIDENCE_DRAFT_SYSTEM,
  EVIDENCE_QUESTIONS_SYSTEM,
  FEEDBACK_SYSTEM,
  GENERATE_SYSTEM,
  IMPROVE_RESPONSIBILITIES_SYSTEM,
  JD_ANALYSIS_SYSTEM,
  NEXT_QUESTION_SYSTEM,
} from "@/lib/ai/prompts";
import {
  cvExtractionSchema,
  evidenceCardDraftSchema,
  generatedContentSchema,
  improvedResponsibilitiesSchema,
  interviewQuestionsSchema,
  jdAnalysisSchema,
  nextQuestionSchema,
  practiceFeedbackSchema,
} from "@/lib/ai/schemas";

const practiceQuestionSchema = z.object({
  question: z.string().min(1),
});

let client: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!client) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new AiProviderError({
        category: "missing_config",
        provider: "gemini",
        userMessage: "AI assistance is temporarily unavailable.",
        message: "GEMINI_API_KEY is not set",
      });
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Reset singleton — used in tests. */
export function resetGeminiClient() {
  client = null;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function geminiStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
): Promise<{ data: T; inputTokens?: number; outputTokens?: number }> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: user,
      config: {
        temperature: 0.3,
        systemInstruction: `${system}

Respond with valid JSON only matching the required schema.
Do not present invented figures as confirmed facts. Follow the system prompt for whether suggested estimates are allowed.
Prefer modest credible wording over exaggeration.`,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text;
    if (!raw) {
      throw new Error("Empty AI response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFences(raw));
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `AI response failed schema validation: ${result.error.message}`,
      );
    }

    const usage = response.usageMetadata;
    return {
      data: result.data,
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
    };
  } catch (err) {
    throw mapProviderFailure(err, "gemini");
  }
}

export class GeminiCareerAiProvider implements CareerAiProvider {
  readonly name = "gemini" as const;
  readonly model = getGeminiModel();

  async extractCv(input: ExtractCvInput) {
    const { data } = await geminiStructured(
      cvExtractionSchema,
      CV_EXTRACT_SYSTEM,
      `CV text:\n\n${input.cvText.slice(0, 40000)}`,
    );
    return data;
  }

  async suggestEvidenceQuestions(input: SuggestEvidenceQuestionsInput) {
    const { data } = await geminiStructured(
      interviewQuestionsSchema,
      EVIDENCE_QUESTIONS_SYSTEM,
      JSON.stringify({
        experience: input.experience,
        focus: input.focus ?? null,
      }),
    );
    return data;
  }

  async decideNextQuestion(input: DecideNextQuestionInput) {
    const { data } = await geminiStructured(
      nextQuestionSchema,
      NEXT_QUESTION_SYSTEM,
      JSON.stringify(input),
    );
    return data;
  }

  async createEvidenceCard(input: CreateEvidenceCardInput) {
    const { data } = await geminiStructured(
      evidenceCardDraftSchema,
      EVIDENCE_DRAFT_SYSTEM,
      JSON.stringify(input),
    );
    return data;
  }

  async analyseJobDescription(input: AnalyseJobDescriptionInput) {
    const { data } = await geminiStructured(
      jdAnalysisSchema,
      JD_ANALYSIS_SYSTEM,
      JSON.stringify(input),
    );
    return data;
  }

  async generateCareerContent(input: GenerateCareerContentInput) {
    const { data } = await geminiStructured(
      generatedContentSchema,
      GENERATE_SYSTEM,
      `Output type: ${input.type}
Optional question: ${input.question ?? "n/a"}
Job target: ${JSON.stringify(input.jobTarget ?? null)}
Confirmed evidence cards: ${JSON.stringify(input.cards)}

Return JSON: { content: string, notes?: string }`,
    );
    return data;
  }

  async improveResponsibilities(input: ImproveResponsibilitiesInput) {
    const styleGuide: Record<ImproveResponsibilitiesInput["style"], string> = {
      polish:
        "Keep the same meaning and facts. Improve clarity, grammar, and CV phrasing only.",
      professional:
        "Use a more formal, professional tone while keeping the same facts.",
      confident:
        "Use confident, impact-focused wording without inventing metrics or outcomes.",
      concise: "Make bullets shorter and punchier without dropping key facts.",
      action:
        "Lead with strong action verbs and clear ownership (I/did) without inventing work.",
    };
    const { data } = await geminiStructured(
      improvedResponsibilitiesSchema,
      IMPROVE_RESPONSIBILITIES_SYSTEM,
      JSON.stringify({
        role: {
          title: input.title,
          organisation: input.organisation,
          type: input.type,
        },
        style: input.style,
        styleInstructions: styleGuide[input.style],
        responsibilities: input.responsibilities,
      }),
    );
    return data;
  }

  async generatePracticeQuestion(input: GeneratePracticeQuestionInput) {
    const { data } = await geminiStructured(
      practiceQuestionSchema,
      GENERATE_SYSTEM,
      `Generate one realistic behavioural interview question grounded only in this confirmed evidence card and optional competency/job target.
Do not invent facts not present in the card.
Evidence card: ${JSON.stringify(input.evidenceCard)}
Competency: ${input.competency ?? "n/a"}
Job target: ${JSON.stringify(input.jobTarget ?? null)}
Return JSON: { question: string }`,
    );
    return data;
  }

  async analysePracticeAnswer(input: AnalysePracticeAnswerInput) {
    const { data } = await geminiStructured(
      practiceFeedbackSchema,
      FEEDBACK_SYSTEM,
      JSON.stringify(input),
    );
    return data;
  }

  async transcribeAudio(input: TranscribeAudioInput) {
    try {
      const ai = getGeminiClient();
      const base64 = input.audio.toString("base64");
      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: input.mimeType || "audio/webm",
                  data: base64,
                },
              },
              {
                text: "Transcribe this interview practice answer verbatim. Return only the transcript text with no commentary.",
              },
            ],
          },
        ],
        config: { temperature: 0 },
      });

      const transcript = response.text?.trim();
      if (!transcript) {
        throw new Error("Empty transcription");
      }
      return { transcript };
    } catch (err) {
      throw mapProviderFailure(err, "gemini");
    }
  }
}
