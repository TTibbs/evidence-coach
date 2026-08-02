import { browser } from "wxt/browser";
import { cleanLinkedInJobText } from "../../src/linkedin-cleanup";
import "./style.css";

type CapturedJobDraft = {
  title: string;
  company: string;
  description: string;
  sourceUrl: string;
  capturedAt: string;
};

type JobTrustCheckResult = {
  status: "good_signals" | "needs_review" | "unable_to_verify";
  score: number;
  summary: string;
  provider: "tavily" | "gemini" | "none";
  officialListing: {
    status: "found" | "likely_found" | "not_found" | "not_checked";
    url: string | null;
    label: string;
  };
  manualSearchUrl: string | null;
  signals: Array<{
    id: string;
    label: string;
    status: "positive" | "neutral" | "warning" | "unknown";
    detail: string;
  }>;
};

const DEFAULT_APP_URL = "http://localhost:3000";
const PROMPT_ENABLED_KEY = "linkedinPromptEnabled";
const POPUP_OPEN_UNTIL_KEY = "extensionPopupOpenUntil";
const POPUP_HEARTBEAT_MS = 1000;
const POPUP_OPEN_TTL_MS = 2500;
const appUrl = (
  import.meta.env.WXT_EVIDENCE_COACH_URL ?? DEFAULT_APP_URL
).replace(/\/$/, "");

const captureButton = document.querySelector<HTMLButtonElement>("#capture");
const openButton = document.querySelector<HTMLButtonElement>("#open");
const copyButton = document.querySelector<HTMLButtonElement>("#copy");
const promptToggle =
  document.querySelector<HTMLInputElement>("#prompt-toggle");
const descriptionField =
  document.querySelector<HTMLTextAreaElement>("#description");
const statusText = document.querySelector<HTMLParagraphElement>("#status");
const preview = document.querySelector<HTMLElement>(".preview");
const titleText = document.querySelector<HTMLElement>("#title");
const sourceText = document.querySelector<HTMLElement>("#source");
const descriptionCount =
  document.querySelector<HTMLElement>("#description-count");
const trustPanel = document.querySelector<HTMLElement>("#trust-panel");
const trustSummary = document.querySelector<HTMLElement>("#trust-summary");
const trustSignals = document.querySelector<HTMLUListElement>("#trust-signals");
const trustBadge = document.querySelector<HTMLElement>("#trust-badge");
const officialSearch =
  document.querySelector<HTMLAnchorElement>("#official-search");

let currentDraft: CapturedJobDraft | null = null;
let popupHeartbeat: ReturnType<typeof setInterval> | null = null;

async function loadPromptPreference() {
  const stored = await browser.storage.local.get(PROMPT_ENABLED_KEY);
  const enabled = stored[PROMPT_ENABLED_KEY] !== false;
  if (promptToggle) promptToggle.checked = enabled;
}

async function markPopupOpen() {
  await browser.storage.local.set({
    [POPUP_OPEN_UNTIL_KEY]: Date.now() + POPUP_OPEN_TTL_MS,
  });
}

function startPopupHeartbeat() {
  void markPopupOpen();
  popupHeartbeat = setInterval(() => {
    void markPopupOpen();
  }, POPUP_HEARTBEAT_MS);
}

function stopPopupHeartbeat() {
  if (popupHeartbeat) clearInterval(popupHeartbeat);
  popupHeartbeat = null;
  void browser.storage.local.remove(POPUP_OPEN_UNTIL_KEY);
}

function setStatus(message: string) {
  if (statusText) statusText.textContent = message;
}

function extractFromPage(): CapturedJobDraft {
  const selectedText = window.getSelection()?.toString().trim() ?? "";
  const main =
    document.querySelector("main") ??
    document.querySelector("[role='main']") ??
    document.body;
  const description = (selectedText || main?.innerText || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const title =
    document
      .querySelector("h1")
      ?.textContent?.replace(/\s+/g, " ")
      .trim() ||
    document.title.replace(/\s+/g, " ").trim() ||
    "Untitled role";

  return {
    title,
    company: "",
    description,
    sourceUrl: window.location.href,
    capturedAt: new Date().toISOString(),
  };
}

function encodeDraft(draft: CapturedJobDraft) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildImportUrl(draft: CapturedJobDraft) {
  const url = new URL("/job-targets", appUrl);
  url.hash = `extension-draft=${encodeDraft(sanitizeDraft(draft))}`;
  return url.toString();
}

async function captureActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");

  if (tab.url?.includes("linkedin.com/jobs")) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        type: "capture-linkedin-job",
      });
      if (isCapturedJobDraft(response)) return response;
    } catch {
      throw new Error(
        "LinkedIn capture is not ready yet. Refresh the LinkedIn job page, then try again.",
      );
    }

    throw new Error("LinkedIn capture returned no readable job description.");
  }

  const [result] = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractFromPage,
  });

  if (!result?.result?.description) {
    throw new Error("No readable job description text found on this page.");
  }

  return result.result;
}

function isCapturedJobDraft(value: unknown): value is CapturedJobDraft {
  return (
    typeof value === "object" &&
    value !== null &&
    "description" in value &&
    typeof value.description === "string" &&
    "sourceUrl" in value &&
    typeof value.sourceUrl === "string"
  );
}

function renderDraft(draft: CapturedJobDraft) {
  const sanitizedDraft = sanitizeDraft(draft);
  currentDraft = sanitizedDraft;
  if (preview) preview.hidden = false;
  if (descriptionField) descriptionField.value = sanitizedDraft.description;
  if (titleText) titleText.textContent = sanitizedDraft.title;
  if (sourceText) {
    sourceText.textContent = new URL(sanitizedDraft.sourceUrl).hostname;
  }
  if (descriptionCount) {
    descriptionCount.textContent = `${sanitizedDraft.description.length.toLocaleString()} chars`;
  }
  if (openButton) openButton.disabled = false;
  if (copyButton) copyButton.disabled = false;
  captureButton?.classList.remove("primary");
  captureButton?.classList.add("secondary");
  openButton?.classList.remove("secondary");
  openButton?.classList.add("primary");
  setStatus(
    `Captured ${sanitizedDraft.description.length.toLocaleString()} characters. Review before saving.`,
  );
  void renderTrustCheck(sanitizedDraft);
}

function sanitizeDraft(draft: CapturedJobDraft): CapturedJobDraft {
  if (!draft.sourceUrl.includes("linkedin.com/jobs")) return draft;

  return {
    ...draft,
    description: cleanLinkedInJobText(draft.description),
  };
}

async function fetchJobTrustCheck(draft: CapturedJobDraft) {
  const response = await fetch(`${appUrl}/api/job-trust-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: draft.title,
      company: draft.company,
      description: draft.description,
      sourceUrl: draft.sourceUrl,
    }),
  });

  if (!response.ok) throw new Error("Job confidence check failed.");
  const payload = (await response.json()) as { check?: JobTrustCheckResult };
  if (!payload.check) throw new Error("Job confidence check returned no result.");
  return payload.check;
}

async function renderTrustCheck(draft: CapturedJobDraft) {
  if (!trustPanel || !trustSummary || !trustSignals) return;

  trustPanel.hidden = false;
  trustSummary.textContent = "Checking job confidence...";
  if (trustBadge) trustBadge.textContent = "Checking";
  trustSignals.replaceChildren();
  if (officialSearch) officialSearch.hidden = true;

  try {
    const check = await fetchJobTrustCheck(draft);
    trustSummary.textContent = `${trustLabel(check)}${providerLabel(check)} - ${check.summary}`;
    if (trustBadge) trustBadge.textContent = trustBadgeLabel(check);
    for (const signal of check.signals.slice(0, 3)) {
      const item = document.createElement("li");
      item.textContent = `${signal.label}: ${signal.detail}`;
      item.dataset.status = signal.status;
      trustSignals.append(item);
    }

    if (officialSearch && check.manualSearchUrl) {
      officialSearch.hidden = false;
      officialSearch.href = check.officialListing.url ?? check.manualSearchUrl;
      officialSearch.textContent =
        check.officialListing.url === null
          ? "Search official listing"
          : "Open official listing";
    }
  } catch {
    trustSummary.textContent =
      "Confidence check unavailable. You can still open a reviewable draft.";
    if (trustBadge) trustBadge.textContent = "Unavailable";
  }
}

function trustLabel(check: JobTrustCheckResult) {
  if (check.status === "good_signals") return `Confidence ${check.score}/100`;
  if (check.status === "needs_review") return "Needs review";
  return "Unable to verify";
}

function providerLabel(check: JobTrustCheckResult) {
  if (check.provider === "none") return "";
  return ` via ${check.provider === "tavily" ? "Tavily" : "Gemini fallback"}`;
}

function trustBadgeLabel(check: JobTrustCheckResult) {
  if (check.officialListing.status === "found") return "Found";
  if (check.officialListing.status === "likely_found") return "Likely";
  if (check.officialListing.status === "not_found") return "Review";
  return "Manual";
}

captureButton?.addEventListener("click", async () => {
  setStatus("Capturing active tab...");
  try {
    const draft = await captureActiveTab();
    renderDraft(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture failed.";
    setStatus(message);
  }
});

descriptionField?.addEventListener("input", () => {
  if (!currentDraft || !descriptionField) return;
  currentDraft = {
    ...currentDraft,
    description: descriptionField.value.trim(),
  };
});

openButton?.addEventListener("click", async () => {
  if (!currentDraft) return;
  await browser.tabs.create({ url: buildImportUrl(currentDraft) });
});

copyButton?.addEventListener("click", async () => {
  if (!currentDraft) return;
  await navigator.clipboard.writeText(currentDraft.description);
  setStatus("Copied captured text to clipboard.");
});

promptToggle?.addEventListener("change", async () => {
  await browser.storage.local.set({
    [PROMPT_ENABLED_KEY]: promptToggle.checked,
  });
  setStatus(
    promptToggle.checked
      ? "LinkedIn prompt enabled. Refresh LinkedIn if it is not visible."
      : "LinkedIn prompt disabled.",
  );
});

void loadPromptPreference();
startPopupHeartbeat();
window.addEventListener("pagehide", stopPopupHeartbeat);
window.addEventListener("unload", stopPopupHeartbeat);
