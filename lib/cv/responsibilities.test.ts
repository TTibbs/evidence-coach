import { describe, expect, it } from "vitest";
import {
  normalizeExperienceResponsibilities,
  splitDutyProse,
} from "@/lib/cv/responsibilities";

describe("splitDutyProse", () => {
  it("keeps a short single paragraph as one duty", () => {
    expect(splitDutyProse("Picked orders to headset targets.")).toEqual([
      "Picked orders to headset targets.",
    ]);
  });

  it("splits bullet/newline lists", () => {
    expect(
      splitDutyProse("- Operate forklifts\n- Pick orders\n- Label cartons"),
    ).toEqual(["Operate forklifts", "Pick orders", "Label cartons"]);
  });

  it("splits long compound prose on ', and '", () => {
    const prose =
      "Operate VNA forklifts, platform pallet trucks, headset-directed picking systems, and pallet racking workflows in a target-driven distribution environment, and being a machine minder for automated machinery which made boxes, put the lids on them and labeled them.";

    const parts = splitDutyProse(prose);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0]).toMatch(/Operate VNA forklifts/i);
    expect(parts.some((p) => /machine minder/i.test(p))).toBe(true);
  });
});

describe("normalizeExperienceResponsibilities", () => {
  it("promotes description into responsibilities when empty", () => {
    const result = normalizeExperienceResponsibilities({
      title: "Warehouse Operative",
      description:
        "Operate VNA forklifts and headset-directed picking systems in a target-driven environment, and being a machine minder for automated machinery.",
      responsibilities: [],
    });

    expect(result.responsibilities.length).toBeGreaterThan(0);
    expect(result.responsibilities.join(" ")).toMatch(/forklifts/i);
    expect(result.description).toBeNull();
  });

  it("leaves existing responsibilities alone", () => {
    const result = normalizeExperienceResponsibilities({
      description: "Overview text",
      responsibilities: ["Already extracted duty"],
    });

    expect(result.responsibilities).toEqual(["Already extracted duty"]);
    expect(result.description).toBe("Overview text");
  });
});
