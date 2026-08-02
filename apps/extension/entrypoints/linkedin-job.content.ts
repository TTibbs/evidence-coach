import { browser } from "wxt/browser";
import { cleanLinkedInJobText } from "../src/linkedin-cleanup";

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
const LEGACY_PROMPT_IDS = ["evidence-coach-capture-prompt"];
const PROMPT_ID = "evidence-coach-capture-prompt-v2";
const PROMPT_ENABLED_KEY = "linkedinPromptEnabled";
const POPUP_OPEN_UNTIL_KEY = "extensionPopupOpenUntil";

let activePromptKey: string | null = null;
let dismissedPromptKey: string | null = null;
let syncQueued = false;

export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  runAt: "document_idle",
  main(ctx) {
    browser.runtime.onMessage.addListener((message) => {
      if (!isCaptureMessage(message)) return undefined;
      return Promise.resolve(extractLinkedInJob());
    });

    void syncPrompt();
    ctx.setInterval(() => {
      void syncPrompt();
    }, 1500);
    installNavigationListeners();
  },
});

function isCaptureMessage(message: unknown): message is { type: "capture-linkedin-job" } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "capture-linkedin-job"
  );
}

async function syncPrompt() {
  if (!isLinkedInJobView()) {
    activePromptKey = null;
    dismissedPromptKey = null;
    removePrompt();
    return;
  }

  const promptKey = currentJobPromptKey();
  if (promptKey !== activePromptKey) {
    activePromptKey = promptKey;
    dismissedPromptKey = null;
    removePrompt();
  }

  if (!(await shouldShowPrompt())) {
    removePrompt();
    return;
  }

  mountPrompt();
}

async function shouldShowPrompt() {
  const stored = await browser.storage.local.get([
    PROMPT_ENABLED_KEY,
    POPUP_OPEN_UNTIL_KEY,
  ]);
  const promptEnabled = stored[PROMPT_ENABLED_KEY] !== false;
  if (!promptEnabled) return false;

  const popupOpenUntil = Number(stored[POPUP_OPEN_UNTIL_KEY] ?? 0);
  if (Number.isFinite(popupOpenUntil) && popupOpenUntil > Date.now()) {
    return false;
  }

  return dismissedPromptKey !== currentJobPromptKey();
}

function extractLinkedInJob(): CapturedJobDraft {
  const { title, company } = extractJobIdentity();

  return {
    title,
    company,
    description: extractJobDescriptionText(),
    sourceUrl: location.href,
    capturedAt: new Date().toISOString(),
  };
}

function extractJobIdentity() {
  const rawTitle =
    firstText([
      ".job-details-jobs-unified-top-card__job-title h1",
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title h1",
      ".jobs-unified-top-card__job-title",
      "h1",
    ]) ||
    document.title ||
    "LinkedIn job";
  const rawCompany =
    firstText([
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      ".job-details-jobs-unified-top-card__primary-description-container a",
      ".jobs-unified-top-card__primary-description-container a",
    ]) ?? "";

  const titleParts = rawTitle
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const title = titleParts[0] || rawTitle.trim() || "LinkedIn job";
  const company =
    rawCompany ||
    titleParts.find((part) => part.toLowerCase() !== "linkedin" && part !== title) ||
    "";

  return { title, company };
}

function firstText(selectors: string[]) {
  for (const selector of selectors) {
    const text = document
      .querySelector<HTMLElement>(selector)
      ?.innerText?.replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }
  return null;
}

function extractJobDescriptionText() {
  const descriptionSelectors = [
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
    ".jobs-description",
    "#job-details",
  ];
  const descriptionText = descriptionSelectors
    .map((selector) => document.querySelector<HTMLElement>(selector)?.innerText)
    .find((text) => text && text.trim().length > 200);

  if (descriptionText) return cleanLinkedInJobText(descriptionText);

  const detailsPanel =
    document.querySelector<HTMLElement>(".jobs-search__job-details") ??
    document.querySelector<HTMLElement>(".jobs-details") ??
    document.querySelector<HTMLElement>("main") ??
    document.body;

  return cleanLinkedInJobText(detailsPanel.innerText);
}

function currentJobPromptKey() {
  const url = new URL(location.href);
  return currentJobId() ?? visibleJobIdentity() ?? url.pathname;
}

function isLinkedInJobView() {
  if (!location.hostname.endsWith("linkedin.com")) return false;
  if (!location.pathname.includes("/jobs")) return false;
  return Boolean(currentJobId() || visibleJobIdentity());
}

function currentJobId() {
  const url = new URL(location.href);
  const selectedJobId = url.searchParams.get("currentJobId");
  if (selectedJobId) return selectedJobId;

  return url.pathname.match(/\/jobs\/view\/(\d+)/)?.[1] ?? null;
}

function visibleJobIdentity() {
  const title = firstText([
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title",
  ]);
  const description = document.querySelector<HTMLElement>(
    ".jobs-description, .jobs-description__content, #job-details",
  )?.innerText;

  if (!title || !description || description.trim().length < 200) return null;
  return `${title}:${description.trim().slice(0, 80)}`;
}

function installNavigationListeners() {
  const schedule = () => schedulePromptSync();
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args);
    schedule();
    return result;
  };

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args);
    schedule();
    return result;
  };

  window.addEventListener("popstate", schedule);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function schedulePromptSync() {
  if (syncQueued) return;
  syncQueued = true;
  window.setTimeout(() => {
    syncQueued = false;
    void syncPrompt();
  }, 250);
}

function removePrompt() {
  for (const id of LEGACY_PROMPT_IDS) {
    document.getElementById(id)?.remove();
  }
  document.getElementById(PROMPT_ID)?.remove();
}

function dismissCurrentPrompt() {
  dismissedPromptKey = currentJobPromptKey();
  removePrompt();
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
  const appUrl = (
    import.meta.env.WXT_EVIDENCE_COACH_URL ?? DEFAULT_APP_URL
  ).replace(/\/$/, "");
  const url = new URL("/job-targets", appUrl);
  url.hash = `extension-draft=${encodeDraft({
    ...draft,
    description: cleanLinkedInJobText(draft.description),
  })}`;
  return url.toString();
}

async function fetchJobTrustCheck(draft: CapturedJobDraft) {
  const appUrl = (
    import.meta.env.WXT_EVIDENCE_COACH_URL ?? DEFAULT_APP_URL
  ).replace(/\/$/, "");
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

async function renderPromptTrustCheck(
  shadow: ShadowRoot,
  draft: CapturedJobDraft,
) {
  const trust = shadow.querySelector<HTMLElement>("#trust");
  const trustBadge = shadow.querySelector<HTMLElement>("#trust-badge");
  const officialSearch =
    shadow.querySelector<HTMLAnchorElement>("#official-search");
  if (!trust) return;

  try {
    const check = await fetchJobTrustCheck(draft);
    trust.textContent = `${trustLabel(check)}${providerLabel(check)} - ${check.summary}`;
    if (trustBadge) trustBadge.textContent = trustBadgeLabel(check);

    if (officialSearch && check.manualSearchUrl) {
      officialSearch.hidden = false;
      officialSearch.href = check.officialListing.url ?? check.manualSearchUrl;
      officialSearch.textContent =
        check.officialListing.url === null
          ? "Search listing"
          : "Official listing";
    }
  } catch {
    trust.textContent =
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

function mountPrompt() {
  for (const id of LEGACY_PROMPT_IDS) {
    document.getElementById(id)?.remove();
  }

  if (document.getElementById(PROMPT_ID)) return;

  const host = document.createElement("div");
  host.id = PROMPT_ID;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .card {
        width: 326px;
        border: 1px solid #dedbd4;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(28, 25, 23, 0.18);
        color: #1c1917;
        padding: 14px;
      }

      .eyebrow {
        margin: 0;
        color: #0f766e;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .title {
        margin: 3px 0 0;
        font-size: 15px;
        font-weight: 800;
        line-height: 1.25;
      }

      .copy {
        margin: 6px 0 10px;
        color: #57534e;
        font-size: 12px;
        line-height: 1.4;
      }

      .trust-row {
        display: grid;
        gap: 6px;
        margin: 0 0 12px;
        border: 1px solid #ece8e1;
        border-radius: 8px;
        background: #fafaf9;
        padding: 9px 10px;
      }

      .trust-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .trust-label {
        color: #1c1917;
        font-size: 12px;
        font-weight: 800;
      }

      .badge {
        border-radius: 999px;
        background: #e7f3ef;
        padding: 3px 7px;
        color: #0f766e;
        font-size: 10px;
        font-weight: 800;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      button,
      a.button {
        display: inline-flex;
        min-height: 34px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 999px;
        padding: 7px 11px;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
        line-height: 1;
        text-decoration: none;
      }

      button.primary {
        border: 1px solid #0f766e;
        background: #0f766e;
        color: #ffffff;
      }

      button.secondary,
      a.button {
        border: 1px solid #d6d3d1;
        background: #ffffff;
        color: #292524;
      }

      button.ghost {
        grid-column: span 2;
        border: 1px solid transparent;
        background: transparent;
        color: #57534e;
      }

      .status {
        margin: 10px 0 0;
        color: #57534e;
        font-size: 12px;
        line-height: 1.35;
      }

      .trust {
        margin: 0;
        color: #57534e;
        font-size: 11px;
        line-height: 1.35;
      }

      [hidden] {
        display: none !important;
      }
    </style>
    <section class="card" aria-live="polite">
      <p class="eyebrow">Evidence Coach</p>
      <h2 class="title">Capture selected job?</h2>
      <p class="copy">Check the role, then open a reviewable draft in Evidence Coach.</p>
      <div class="trust-row">
        <div class="trust-head">
          <span class="trust-label">Job confidence</span>
          <span id="trust-badge" class="badge">Checking</span>
        </div>
        <p id="trust" class="trust">Checking job confidence...</p>
      </div>
      <div class="actions">
        <button id="capture" class="primary" type="button">Open draft</button>
        <a id="official-search" class="button" href="#" target="_blank" rel="noreferrer" hidden>Search listing</a>
        <button id="dismiss" class="ghost" type="button">Dismiss</button>
      </div>
      <p id="status" class="status" hidden></p>
    </section>
  `;

  shadow.querySelector("#dismiss")?.addEventListener("click", () => {
    dismissCurrentPrompt();
  });

  shadow.querySelector("#capture")?.addEventListener("click", () => {
    const status = shadow.querySelector<HTMLElement>("#status");
    const draft = extractLinkedInJob();
    if (!draft.description) {
      if (status) {
        status.hidden = false;
        status.textContent =
          "I could not find readable job text. Select the description, then use the toolbar popup.";
      }
      return;
    }
    window.open(buildImportUrl(draft), "_blank", "noopener,noreferrer");
  });

  document.documentElement.append(host);
  void renderPromptTrustCheck(shadow, extractLinkedInJob());
}
