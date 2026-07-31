import { describe, expect, it } from "vitest";
import { cardsWithConfirmedMetricsOnly } from "@/lib/ai/confirmed-metrics";

describe("cardsWithConfirmedMetricsOnly", () => {
  it("keeps only metrics with confirmed === true", () => {
    const cards = [
      {
        id: "1",
        title: "Example",
        metrics: [
          { label: "Time saved", value: "~15%", confirmed: false },
          { label: "Errors", value: "3 fewer", confirmed: true },
        ],
      },
    ];

    const filtered = cardsWithConfirmedMetricsOnly(cards);
    expect(filtered[0].metrics).toEqual([
      { label: "Errors", value: "3 fewer", confirmed: true },
    ]);
    expect(filtered[0].title).toBe("Example");
  });

  it("leaves cards without metrics unchanged", () => {
    const cards = [{ id: "2", title: "No metrics" }];
    expect(cardsWithConfirmedMetricsOnly(cards)).toEqual(cards);
  });
});
