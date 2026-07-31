export const ROLE_COVERAGE_CHECKPOINT =
  "Before I draft the card, is there anything else you did in this role that matters here? Think about other responsibilities, a second role at the same employer, tools, handovers, metrics, or outcomes.";

export function shouldAskRoleCoverageCheckpoint(params: {
  questions: string[];
  currentIndex: number;
  responsibilities: string[];
}) {
  return (
    params.currentIndex >= params.questions.length &&
    params.responsibilities.filter((item) => item.trim()).length > 1 &&
    !params.questions.includes(ROLE_COVERAGE_CHECKPOINT)
  );
}

export function evidenceInterviewHref(experienceId: string, focus?: string | null) {
  const params = new URLSearchParams({ experienceId });
  const trimmedFocus = focus?.trim();
  if (trimmedFocus) params.set("focus", trimmedFocus);

  return `/evidence/interview/new?${params.toString()}`;
}
