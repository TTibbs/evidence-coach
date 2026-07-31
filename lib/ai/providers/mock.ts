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

/**
 * Deterministic mock provider for local development and automated tests.
 */
export class MockCareerAiProvider implements CareerAiProvider {
  readonly name = "mock" as const;
  readonly model = "mock-1";

  async extractCv(input: ExtractCvInput) {
    return {
      name: "Alex Example",
      experiences: [
        {
          type: "employment" as const,
          organisation: "Example Co",
          title: "Warehouse Operative",
          location: null,
          startDate: "2022-01",
          endDate: null,
          isCurrent: true,
          description: input.cvText.slice(0, 120) || "Helped new starters.",
          responsibilities: ["Supported new starters", "Maintained accuracy"],
        },
      ],
      skills: ["teamwork", "communication"],
    };
  }

  async suggestEvidenceQuestions(input: SuggestEvidenceQuestionsInput) {
    void input;
    return {
      topic: "Helping a new starter",
      questions: [
        "What was happening when the new starter needed help?",
        "What did you personally do?",
        "What changed as a result?",
        "How did you know it worked?",
        "What would you do differently?",
      ],
    };
  }

  async decideNextQuestion(input: DecideNextQuestionInput) {
    if (input.answers.length >= 3) {
      return { done: true, nextQuestion: null, reason: "Enough detail" };
    }
    return {
      done: false,
      nextQuestion: "Can you describe one concrete action you took?",
      reason: "Need more action detail",
    };
  }

  async createEvidenceCard(input: CreateEvidenceCardInput) {
    const answers = input.qa.map((q) => q.answer).filter(Boolean);
    const joined = answers.join(" ").toLowerCase();
    const impliesTimeSaving =
      /\b(save|saved|saving|faster|quicker|reduce|reduced|reducing)\b/.test(
        joined,
      ) && /\b(time|hours?|days?|week|process|development|delivery)\b/.test(joined);

    return {
      title: input.topic || "Evidence example",
      summary: "Helped a new starter learn the process.",
      situation: input.qa[0]?.answer || "A new starter was struggling.",
      task: "Help them get productive safely.",
      actions: answers.slice(0, 3),
      outcome: "They completed their first shift with fewer errors.",
      reflection: null,
      skills: ["coaching"],
      competencies: ["teamwork", "communication"],
      metrics: impliesTimeSaving
        ? [
            {
              label: "Time to productivity",
              value: "~20% faster",
              confirmed: false,
            },
          ]
        : [],
      sourceFacts: answers,
    };
  }

  async analyseJobDescription(input: AnalyseJobDescriptionInput) {
    return {
      extractedSkills: ["communication", "organisation"],
      extractedCompetencies: ["teamwork", "ownership"],
      matchSummary: {
        strong: ["teamwork"],
        partial: ["communication"],
        gaps: input.description.toLowerCase().includes("leadership")
          ? ["leadership"]
          : [],
      },
    };
  }

  async generateCareerContent(input: GenerateCareerContentInput) {
    return {
      content: `Generated ${input.type} from confirmed evidence (mock).`,
      notes: "Mock output for tests.",
    };
  }

  async improveResponsibilities(input: ImproveResponsibilitiesInput) {
    const lines = input.responsibilities.map((line) => line.trim()).filter(Boolean);
    if (input.style === "concise") {
      return {
        responsibilities: lines.map((line) =>
          line.length > 80 ? `${line.slice(0, 77).trim()}…` : line,
        ),
      };
    }
    if (input.style === "action") {
      return {
        responsibilities: lines.map((line) =>
          /^(led|managed|delivered|built|created|supported|helped)/i.test(line)
            ? line
            : `Delivered ${line.charAt(0).toLowerCase()}${line.slice(1)}`,
        ),
      };
    }
    return {
      responsibilities: lines.map((line) =>
        line.endsWith(".") ? line : `${line}.`,
      ),
    };
  }

  async generatePracticeQuestion(input: GeneratePracticeQuestionInput) {
    void input;
    return {
      question: "Tell me about a time you helped a new starter succeed.",
    };
  }

  async analysePracticeAnswer(input: AnalysePracticeAnswerInput) {
    return {
      scores: {
        relevance: 70,
        ownership: 65,
        specificity: 60,
        structure: 68,
        evidence: 62,
        outcome: 58,
        conciseness: 72,
        delivery: input.mode === "voice" ? 66 : null,
      },
      strengths: ["Clear opening context"],
      improvements: ["Add a concrete personal action"],
      tryAgain: ["Name one result you observed"],
      evidenceComparison: {
        used: ["situation"],
        missed: ["outcome"],
      },
      structureBreakdown: {
        contextPercentage: 50,
        actionPercentage: 30,
        outcomePercentage: 20,
      },
      summary: "Solid start. Strengthen ownership and outcome.",
    };
  }

  async transcribeAudio(input: TranscribeAudioInput) {
    void input;
    return {
      transcript:
        "I helped a new starter understand the picking system and checked their first orders.",
    };
  }
}
