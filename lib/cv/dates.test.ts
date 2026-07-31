import { describe, expect, it } from "vitest";
import { normalizeCvDate } from "@/lib/cv/dates";

describe("normalizeCvDate", () => {
  it("parses common CV month/year forms", () => {
    expect(normalizeCvDate("Oct 2025")).toBe("2025-10-01");
    expect(normalizeCvDate("October 2025")).toBe("2025-10-01");
    expect(normalizeCvDate("May 2025")).toBe("2025-05-01");
    expect(normalizeCvDate("2025 Oct")).toBe("2025-10-01");
  });

  it("parses ISO and numeric forms", () => {
    expect(normalizeCvDate("2025-10-01")).toBe("2025-10-01");
    expect(normalizeCvDate("2025-10")).toBe("2025-10-01");
    expect(normalizeCvDate("10/2025")).toBe("2025-10-01");
    expect(normalizeCvDate("10-2025")).toBe("2025-10-01");
    expect(normalizeCvDate("2025")).toBe("2025-01-01");
  });

  it("returns null for empty or unparseable values", () => {
    expect(normalizeCvDate(null)).toBeNull();
    expect(normalizeCvDate("")).toBeNull();
    expect(normalizeCvDate("   ")).toBeNull();
    expect(normalizeCvDate("present")).toBeNull();
    expect(normalizeCvDate("banana")).toBeNull();
  });
});
