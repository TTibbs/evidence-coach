type MetricLike = {
  label?: unknown;
  value?: unknown;
  confirmed?: unknown;
};

/**
 * Drop unconfirmed metrics before sending cards to career-content generation.
 */
export function cardsWithConfirmedMetricsOnly<T>(cards: T[]): T[] {
  return cards.map((card) => {
    if (!card || typeof card !== "object") return card;
    const record = card as Record<string, unknown>;
    const metrics = record.metrics;
    if (!Array.isArray(metrics)) return card;
    return {
      ...record,
      metrics: metrics.filter(
        (m): m is MetricLike =>
          !!m &&
          typeof m === "object" &&
          (m as MetricLike).confirmed === true,
      ),
    } as T;
  });
}
