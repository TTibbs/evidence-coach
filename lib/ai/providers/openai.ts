import {
  getOpenAiModel,
} from "@/lib/ai/config";
import {
  mapProviderFailure,
  ProviderUnavailableError,
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
import { openaiStructuredCompletion } from "@/lib/ai/structured";
import { getOpenAI } from "@/lib/openai";
import { z } from "zod";

const practiceQuestionSchema = z.object({
  question: z.string().min(1),
});

/**
 * OpenAI implementation retained for future paid access.
 * Factory must not return this while OpenAI is disabled for users.
 */
export class OpenAiCareerAiProvider implements CareerAiProvider {
  readonly name = "openai" as const;
  readonly model = getOpenAiModel();

  private async structured<T>(
    schema: z.ZodType<T>,
    system: string,
    user: string,
  ): Promise<T> {
    try {
      const { data } = await openaiStructuredCompletion(schema, system, user);
      return data;
    } catch (err) {
      throw mapProviderFailure(err, "openai");
    }
  }

  async extractCv(input: ExtractCvInput) {
    return this.structured(
      cvExtractionSchema,
      CV_EXTRACT_SYSTEM,
      `CV text:\n\n${input.cvText.slice(0, 40000)}`,
    );
  }

  async suggestEvidenceQuestions(input: SuggestEvidenceQuestionsInput) {
    return this.structured(
      interviewQuestionsSchema,
      EVIDENCE_QUESTIONS_SYSTEM,
      JSON.stringify({
        experience: input.experience,
        focus: input.focus ?? null,
      }),
    );
  }

  async decideNextQuestion(input: DecideNextQuestionInput) {
    return this.structured(
      nextQuestionSchema,
      NEXT_QUESTION_SYSTEM,
      JSON.stringify(input),
    );
  }

  async createEvidenceCard(input: CreateEvidenceCardInput) {
    return this.structured(
      evidenceCardDraftSchema,
      EVIDENCE_DRAFT_SYSTEM,
      JSON.stringify(input),
    );
  }

  async analyseJobDescription(input: AnalyseJobDescriptionInput) {
    return this.structured(
      jdAnalysisSchema,
      JD_ANALYSIS_SYSTEM,
      JSON.stringify(input),
    );
  }

  async generateCareerContent(input: GenerateCareerContentInput) {
    return this.structured(
      generatedContentSchema,
      GENERATE_SYSTEM,
      `Output type: ${input.type}
Optional question: ${input.question ?? "n/a"}
Job target: ${JSON.stringify(input.jobTarget ?? null)}
Confirmed evidence cards: ${JSON.stringify(input.cards)}

Return JSON: { content: string, notes?: string }`,
    );
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
    return this.structured(
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
  }

  async generatePracticeQuestion(input: GeneratePracticeQuestionInput) {
    return this.structured(
      practiceQuestionSchema,
      GENERATE_SYSTEM,
      `Generate one realistic behavioural interview question grounded only in this confirmed evidence card.
Evidence card: ${JSON.stringify(input.evidenceCard)}
Competency: ${input.competency ?? "n/a"}
Job target: ${JSON.stringify(input.jobTarget ?? null)}
Return JSON: { question: string }`,
    );
  }

  async analysePracticeAnswer(input: AnalysePracticeAnswerInput) {
    return this.structured(
      practiceFeedbackSchema,
      FEEDBACK_SYSTEM,
      JSON.stringify(input),
    );
  }

  async transcribeAudio(input: TranscribeAudioInput) {
    try {
      const openai = getOpenAI();
      const file = new File(
        [new Uint8Array(input.audio)],
        input.filename ?? "answer.webm",
        { type: input.mimeType || "audio/webm" },
      );
      const transcript = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });
      return { transcript: transcript.text };
    } catch (err) {
      if (err instanceof ProviderUnavailableError) throw err;
      throw mapProviderFailure(err, "openai");
    }
  }
}
