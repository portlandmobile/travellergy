/**
 * In-process sliding window for Edamam API quota (e.g. 10 requests / minute on free tier).
 *
 * - Serializes calls through a single queue so concurrent invocations on the same Node instance
 *   cannot burst past the limit.
 * - On serverless (e.g. Vercel), each warm instance has its own counter; for a global cap across
 *   all instances, use an external store (Redis, Upstash, etc.) in addition to this.
 */

const WINDOW_MS = 60_000;

const requestTimestamps: number[] = [];

/** Promise chain gate: one Edamam HTTP flow at a time per process. */
let gateChain: Promise<void> = Promise.resolve();

export function edamamMaxRequestsPerMinute(): number {
  const n = Number(process.env.EDAMAM_MAX_REQUESTS_PER_MINUTE ?? "10");
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(Math.floor(n), 120);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until a slot is available in the rolling window, then record this request
 * (call immediately before the outbound HTTP request).
 */
export async function acquireEdamamSlot(): Promise<void> {
  const max = edamamMaxRequestsPerMinute();

  for (;;) {
    const now = Date.now();
    while (
      requestTimestamps.length > 0 &&
      requestTimestamps[0]! < now - WINDOW_MS
    ) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length < max) {
      requestTimestamps.push(now);
      return;
    }

    const oldest = requestTimestamps[0]!;
    const waitMs = oldest + WINDOW_MS - now + 100;
    await sleep(Math.max(waitMs, 0));
  }
}

/**
 * Run `fn` after acquiring a rate-limit slot and serializing with other Edamam work.
 */
export async function runWithEdamamRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const run = gateChain.then(async () => {
    await acquireEdamamSlot();
    return fn();
  });
  gateChain = run.then(() => {}).catch(() => {});
  return run;
}
