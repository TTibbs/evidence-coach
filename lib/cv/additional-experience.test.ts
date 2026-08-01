import { describe, expect, it } from "vitest";
import { expandCompressedAdditionalExperienceEntries } from "@/lib/cv/additional-experience";

describe("expandCompressedAdditionalExperienceEntries", () => {
  it("splits semicolon-compressed additional roles into separate entries", () => {
    const result = expandCompressedAdditionalExperienceEntries([
      {
        type: "employment",
        title: "Additional Experience",
        description:
          "Warehouse Operative, Hachette Distribution UK (October 2025 - June 2026); Mechanic / Warehouse Operative, Lime (March 2023 - September 2023); earlier roles across warehouse, retail, logistics, courier and construction environments.",
        responsibilities: [],
      },
    ]);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      type: "employment",
      title: "Warehouse Operative",
      organisation: "Hachette Distribution UK",
      startDate: "2025-10-01",
      endDate: "2026-06-01",
      isCurrent: false,
      responsibilities: [],
    });
    expect(result[1]).toMatchObject({
      title: "Mechanic / Warehouse Operative",
      organisation: "Lime",
      startDate: "2023-03-01",
      endDate: "2023-09-01",
    });
    expect(result[2]).toMatchObject({
      title: "Earlier roles",
      organisation: null,
      responsibilities: [
        "earlier roles across warehouse, retail, logistics, courier and construction environments.",
      ],
    });
  });

  it("leaves normal prose entries alone", () => {
    const input = [
      {
        type: "project",
        title: "Portfolio",
        description: "Built a dashboard; improved accessibility.",
        responsibilities: [],
      },
    ];

    expect(expandCompressedAdditionalExperienceEntries(input)).toEqual(input);
  });
});
