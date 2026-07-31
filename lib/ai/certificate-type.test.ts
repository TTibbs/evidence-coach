import { describe, expect, it } from "vitest";
import { coerceExperienceType, cvExtractionSchema } from "@/lib/ai/schemas";

describe("certificate experience type", () => {
  it("coerces certificate aliases", () => {
    expect(coerceExperienceType("certificate")).toBe("certificate");
    expect(coerceExperienceType("Certification")).toBe("certificate");
    expect(coerceExperienceType("cert")).toBe("certificate");
    expect(coerceExperienceType("licence")).toBe("certificate");
    expect(coerceExperienceType("license")).toBe("certificate");
    expect(coerceExperienceType("credential")).toBe("certificate");
    expect(coerceExperienceType("accreditation")).toBe("certificate");
    expect(coerceExperienceType("Certificates & Licenses")).toBe("certificate");
    expect(coerceExperienceType("Professional Certifications")).toBe(
      "certificate",
    );
  });

  it("keeps degrees as education and unknowns as other", () => {
    expect(coerceExperienceType("degree")).toBe("education");
    expect(coerceExperienceType("university")).toBe("education");
    expect(coerceExperienceType("banana")).toBe("other");
  });

  it("accepts certificate in cv extraction schema", () => {
    const result = cvExtractionSchema.safeParse({
      experiences: [
        { type: "Certification", title: "AWS Solutions Architect" },
        { type: "education", title: "BSc Computer Science" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experiences[0].type).toBe("certificate");
      expect(result.data.experiences[1].type).toBe("education");
    }
  });
});
