import { browser } from "wxt/browser";
import { cleanLinkedInJobText } from "../src/linkedin-cleanup";

type CapturedJobDraft = {
  title: string;
  company: string;
  description: string;
  sourceUrl: string;
  capturedAt: string;
};

const DEFAULT_APP_URL = "http://localhost:3000";
const LEGACY_PROMPT_IDS = ["evidence-coach-capture-prompt"];
const PROMPT_ID = "evidence-coach-capture-prompt-v2";
const PROMPT_ENABLED_KEY = "linkedinPromptEnabled";

let activePromptKey: string | null = null;
let dismissedPromptKey: string | null = null;

export default defineContentScript({
  matches: ["*://*.linkedin.com/jobs/*"],
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
  const promptKey = currentJobPromptKey();
  if (promptKey !== activePromptKey) {
    activePromptKey = promptKey;
    dismissedPromptKey = null;
  }

  if (!(await shouldShowPrompt())) {
    removePrompt();
    return;
  }

  mountPrompt();
}

async function shouldShowPrompt() {
  const stored = await browser.storage.local.get(PROMPT_ENABLED_KEY);
  const promptEnabled = stored[PROMPT_ENABLED_KEY] !== false;
  if (!promptEnabled) return false;

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
  return url.searchParams.get("currentJobId") ?? url.pathname;
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
        width: 286px;
        border: 1px solid #d6d3d1;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(28, 25, 23, 0.2);
        color: #1c1917;
        padding: 14px;
      }

      .eyebrow {
        margin: 0 0 4px;
        color: #0f766e;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .title {
        margin: 0;
        font-size: 15px;
        font-weight: 800;
        line-height: 1.25;
      }

      .copy {
        margin: 6px 0 12px;
        color: #57534e;
        font-size: 13px;
        line-height: 1.4;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      button {
        min-height: 32px;
        cursor: pointer;
        border: 1px solid #0f766e;
        border-radius: 999px;
        background: #0f766e;
        padding: 6px 11px;
        color: #ffffff;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
      }

      button.secondary {
        border-color: #d6d3d1;
        background: #ffffff;
        color: #292524;
      }

      .status {
        margin: 10px 0 0;
        color: #57534e;
        font-size: 12px;
        line-height: 1.35;
      }
    </style>
    <section class="card" aria-live="polite">
      <p class="eyebrow">Evidence Coach</p>
      <h2 class="title">Capture selected job?</h2>
      <p class="copy">Open the visible LinkedIn role in Evidence Coach as a reviewable job-target draft.</p>
      <div class="actions">
        <button id="capture" type="button">Open clean draft</button>
        <button id="dismiss" class="secondary" type="button">Dismiss</button>
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
}
