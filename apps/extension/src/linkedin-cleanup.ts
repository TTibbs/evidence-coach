const END_MARKERS = [
  "See how you compare",
  "Applicants for this job",
  "Candidates who clicked apply",
  "Applicant seniority level",
  "Candidate seniority level",
  "Applicant education level",
  "Candidate education level",
  "Exclusive Job Seeker Insights",
  "There’s not enough quality data",
  "There's not enough quality data",
  "Meet the hiring team",
  "People you can reach out to",
];

export function cleanLinkedInJobText(value: string) {
  let text = value
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  text = removeLeadingArtifactLine(text);

  const aboutIndex = indexOfHeading(text, "About the job");
  if (aboutIndex >= 0) {
    text = text.slice(aboutIndex + "About the job".length).trim();
  }

  const endIndex = END_MARKERS.map((marker) => indexOfHeading(text, marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (endIndex !== undefined) {
    text = text.slice(0, endIndex).trim();
  }

  return removeRepeatedFinalLine(
    text
      .replace(/^… more$/gim, "")
      .replace(/^Show more$/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function indexOfHeading(text: string, marker: string) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`(^|\\n)${escaped}[^\\n]*(\\n|$)`, "i"));
  return match?.index ?? -1;
}

function removeLeadingArtifactLine(text: string) {
  const lines = text.split("\n");
  while (lines.length > 1 && lines[0].trim() === "") lines.shift();

  const first = normalizeArtifactLine(lines[0] ?? "");
  if (lines.length > 1 && first.length === 1) {
    lines.shift();
  }

  return lines.join("\n").trim();
}

function normalizeArtifactLine(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]/giu, "")
    .toLowerCase();
}

function removeRepeatedFinalLine(text: string) {
  const lines = text.split("\n");
  const firstMeaningful = lines.find((line) => line.trim().length > 0)?.trim();
  if (!firstMeaningful || firstMeaningful.length < 8) return text;

  let lastIndex = lines.length - 1;
  while (lastIndex >= 0 && lines[lastIndex].trim() === "") lastIndex--;

  if (lastIndex > 0 && lines[lastIndex].trim() === firstMeaningful) {
    return lines.slice(0, lastIndex).join("\n").trim();
  }

  return text;
}
