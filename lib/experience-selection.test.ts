import { describe, expect, it } from "vitest";
import {
  removeSelectedIds,
  selectMissingIds,
  toggleSelectedId,
} from "@/lib/experience-selection";

describe("experience selection helpers", () => {
  it("toggles ids in and out of selection", () => {
    expect(toggleSelectedId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelectedId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects a group without duplicating existing ids", () => {
    expect(selectMissingIds(["a"], ["a", "b", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("removes deleted ids from selection", () => {
    expect(removeSelectedIds(["a", "b", "c"], ["a", "c"])).toEqual(["b"]);
  });
});
