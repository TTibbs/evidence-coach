import { z } from "zod";
import { requireUser, jsonError, aiJsonError } from "@/lib/api/auth";
import { assertWithinLimit, EntitlementError } from "@/lib/entitlements/check";
import {
  decideNextQuestion,
  draftEvidenceCard,
  enrichEvidenceCard,
  suggestEvidenceQuestions,
} from "@/lib/ai/evidence";
import { AiProviderError } from "@/lib/ai/errors";
import {
  ROLE_COVERAGE_CHECKPOINT,
  shouldAskRoleCoverageCheckpoint,
} from "@/lib/evidence-interview-flow";
import { NextResponse } from "next/server";

const startSchema = z.object({
  experienceId: z.string().uuid(),
  focus: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const action = body.action as string;

  try {
  if (action === "start") {
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message);

    const { data: experience, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", parsed.data.experienceId)
      .eq("user_id", user!.id)
      .single();

    if (error || !experience) return jsonError("Experience not found", 404);

    const suggested = await suggestEvidenceQuestions(
      {
        title: experience.title,
        organisation: experience.organisation,
        description: experience.description,
        responsibilities: experience.responsibilities ?? [],
      },
      user!.id,
      parsed.data.focus ?? undefined,
    );

    const { data: interview, error: insertError } = await supabase
      .from("evidence_interviews")
      .insert({
        user_id: user!.id,
        experience_id: experience.id,
        topic: suggested.topic,
        questions: suggested.questions,
        answers: [],
        current_index: 0,
        status: "in_progress",
      })
      .select()
      .single();

    if (insertError) return jsonError(insertError.message, 500);
    return NextResponse.json({ interview }, { status: 201 });
  }

  if (action === "answer") {
    const answerSchema = z.object({
      interviewId: z.string().uuid(),
      answer: z.string().min(1),
    });
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message);

    const { data: interview, error } = await supabase
      .from("evidence_interviews")
      .select("*, experiences(*)")
      .eq("id", parsed.data.interviewId)
      .eq("user_id", user!.id)
      .single();

    if (error || !interview) return jsonError("Interview not found", 404);

    const questions = interview.questions as string[];
    const answers = [...(interview.answers as string[]), parsed.data.answer];
    const currentIndex = interview.current_index + 1;

    const experience = interview.experiences as {
      title: string;
      organisation?: string;
      description?: string;
      responsibilities: string[];
    };

    let nextQuestions = questions;
    let done = currentIndex >= questions.length;

    if (!done) {
      // keep remaining planned questions
    } else if (
      shouldAskRoleCoverageCheckpoint({
        questions,
        currentIndex,
        responsibilities: experience.responsibilities ?? [],
      })
    ) {
      nextQuestions = [...questions, ROLE_COVERAGE_CHECKPOINT];
      done = false;
    } else {
      const decision = await decideNextQuestion(
        {
          experience: {
            title: experience.title,
            organisation: experience.organisation,
            description: experience.description,
            responsibilities: experience.responsibilities ?? [],
          },
          topic: interview.topic ?? "",
          asked: questions,
          answers,
        },
        user!.id,
      );
      if (!decision.done && decision.nextQuestion) {
        nextQuestions = [...questions, decision.nextQuestion];
        done = false;
      } else {
        done = true;
      }
    }

    if (done) {
      const draft = await draftEvidenceCard(
        {
          experience: {
            title: experience.title,
            organisation: experience.organisation,
            description: experience.description,
            responsibilities: experience.responsibilities ?? [],
          },
          topic: interview.topic ?? "",
          qa: nextQuestions.slice(0, answers.length).map((q, i) => ({
            question: q,
            answer: answers[i] ?? "",
          })),
        },
        user!.id,
      );

      const { data: card, error: cardError } = await supabase
        .from("evidence_cards")
        .insert({
          user_id: user!.id,
          experience_id: interview.experience_id,
          title: draft.title,
          summary: draft.summary,
          situation: draft.situation,
          task: draft.task,
          actions: draft.actions,
          outcome: draft.outcome,
          reflection: draft.reflection,
          skills: draft.skills,
          competencies: draft.competencies,
          metrics: draft.metrics,
          source_facts: draft.sourceFacts,
          confidence_status: "draft",
        })
        .select()
        .single();

      if (cardError) return jsonError(cardError.message, 500);

      await supabase
        .from("evidence_interviews")
        .update({
          answers,
          questions: nextQuestions,
          current_index: currentIndex,
          status: "completed",
          evidence_card_id: card.id,
        })
        .eq("id", interview.id);

      return NextResponse.json({ done: true, card, interviewId: interview.id });
    }

    const { data: updated, error: updateError } = await supabase
      .from("evidence_interviews")
      .update({
        answers,
        questions: nextQuestions,
        current_index: currentIndex,
      })
      .eq("id", interview.id)
      .select()
      .single();

    if (updateError) return jsonError(updateError.message, 500);
    return NextResponse.json({
      done: false,
      interview: updated,
      currentQuestion: nextQuestions[currentIndex],
    });
  }

  if (action === "enrich") {
    const enrichSchema = z.object({
      cardId: z.string().uuid(),
      additionalDetails: z.string().trim().min(1),
    });
    const parsed = enrichSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message);

    const { data: existingCard, error } = await supabase
      .from("evidence_cards")
      .select("*, experiences(*)")
      .eq("id", parsed.data.cardId)
      .eq("user_id", user!.id)
      .single();

    if (error || !existingCard) return jsonError("Evidence card not found", 404);
    if (existingCard.confidence_status !== "draft") {
      return jsonError("Only draft evidence cards can be enriched");
    }

    const experience = existingCard.experiences as {
      title: string;
      organisation?: string | null;
      description?: string | null;
      responsibilities?: string[] | null;
    };
    const draft = await enrichEvidenceCard(
      {
        experience: {
          title: experience.title,
          organisation: experience.organisation,
          description: experience.description,
          responsibilities: experience.responsibilities ?? [],
        },
        existingCard,
        additionalDetails: parsed.data.additionalDetails,
      },
      user!.id,
    );

    const { data: card, error: updateError } = await supabase
      .from("evidence_cards")
      .update({
        title: draft.title,
        summary: draft.summary,
        situation: draft.situation,
        task: draft.task,
        actions: draft.actions,
        outcome: draft.outcome,
        reflection: draft.reflection,
        skills: draft.skills,
        competencies: draft.competencies,
        metrics: draft.metrics,
        source_facts: draft.sourceFacts,
        confidence_status: "draft",
      })
      .eq("id", existingCard.id)
      .eq("user_id", user!.id)
      .select("*, experiences(title, organisation)")
      .single();

    if (updateError) return jsonError(updateError.message, 500);
    return NextResponse.json({ card });
  }

  if (action === "gap-scan") {
    const gapScanSchema = z.object({
      cardId: z.string().uuid(),
      uncoveredResponsibilities: z.array(z.string()).default([]),
    });
    const parsed = gapScanSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message);

    const { data: existingCard, error } = await supabase
      .from("evidence_cards")
      .select("*, experiences(*)")
      .eq("id", parsed.data.cardId)
      .eq("user_id", user!.id)
      .single();

    if (error || !existingCard) return jsonError("Evidence card not found", 404);
    if (existingCard.confidence_status !== "draft") {
      return jsonError("Only draft evidence cards can be scanned for gaps");
    }

    const experience = existingCard.experiences as {
      title: string;
      organisation?: string | null;
      description?: string | null;
      responsibilities?: string[] | null;
    };
    const focus =
      parsed.data.uncoveredResponsibilities.length > 0
        ? `Check whether this draft is missing detail about: ${parsed.data.uncoveredResponsibilities.join("; ")}`
        : "Check whether the draft needs any follow-up questions before confirmation.";
    const suggested = await suggestEvidenceQuestions(
      {
        title: experience.title,
        organisation: experience.organisation,
        description: [
          experience.description,
          `Draft card title: ${existingCard.title}`,
          `Draft summary: ${existingCard.summary}`,
          `Draft situation: ${existingCard.situation}`,
          `Draft actions: ${(existingCard.actions ?? []).join("; ")}`,
          `Draft outcome: ${existingCard.outcome}`,
        ]
          .filter(Boolean)
          .join("\n"),
        responsibilities: experience.responsibilities ?? [],
      },
      user!.id,
      focus,
    );

    return NextResponse.json({
      topic: suggested.topic,
      questions: suggested.questions.slice(0, 5),
    });
  }

  if (action === "confirm") {
    const confirmSchema = z.object({
      cardId: z.string().uuid(),
      updates: z
        .object({
          title: z.string().optional(),
          summary: z.string().optional(),
          situation: z.string().optional(),
          task: z.string().optional().nullable(),
          actions: z.array(z.string()).optional(),
          outcome: z.string().optional(),
          reflection: z.string().optional().nullable(),
          skills: z.array(z.string()).optional(),
          competencies: z.array(z.string()).optional(),
          metrics: z.array(z.any()).optional(),
          sourceFacts: z.array(z.string()).optional(),
        })
        .optional(),
    });
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message);

    try {
      await assertWithinLimit(user!.id, "confirm_evidence_card");
    } catch (e) {
      if (e instanceof EntitlementError) return jsonError(e.message, 403);
      throw e;
    }

    const updates: Record<string, unknown> = {
      confidence_status: "confirmed",
    };
    const u = parsed.data.updates;
    if (u) {
      if (u.title !== undefined) updates.title = u.title;
      if (u.summary !== undefined) updates.summary = u.summary;
      if (u.situation !== undefined) updates.situation = u.situation;
      if (u.task !== undefined) updates.task = u.task;
      if (u.actions !== undefined) updates.actions = u.actions;
      if (u.outcome !== undefined) updates.outcome = u.outcome;
      if (u.reflection !== undefined) updates.reflection = u.reflection;
      if (u.skills !== undefined) updates.skills = u.skills;
      if (u.competencies !== undefined) updates.competencies = u.competencies;
      if (u.metrics !== undefined) {
        updates.metrics = (u.metrics as { confirmed?: boolean }[]).map((m) => ({
          ...m,
          confirmed: true,
        }));
      }
      if (u.sourceFacts !== undefined) updates.source_facts = u.sourceFacts;
    }

    const { data: card, error } = await supabase
      .from("evidence_cards")
      .update(updates)
      .eq("id", parsed.data.cardId)
      .eq("user_id", user!.id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ card });
  }

  return jsonError("Unknown action");
  } catch (err) {
    if (err instanceof AiProviderError) return aiJsonError(err);
    throw err;
  }
}

export async function GET(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Missing id");

  const { data, error } = await supabase
    .from("evidence_interviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ interview: data });
}
