import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAsyncRefreshScheduler } from "@/lib/async-refresh-scheduler";

describe("async refresh scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("coalesces several immediate refresh requests into one run", async () => {
    const refresh = vi.fn(async () => undefined);
    const scheduler = createAsyncRefreshScheduler(refresh, { delayMs: 20 });

    scheduler.request();
    scheduler.request();
    scheduler.request();

    await vi.advanceTimersByTimeAsync(20);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("runs one follow-up refresh when a request arrives during an active run", async () => {
    let resolveFirst: () => void = () => undefined;
    const refresh = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const scheduler = createAsyncRefreshScheduler(refresh, { delayMs: 20 });

    scheduler.request();
    await vi.advanceTimersByTimeAsync(20);
    scheduler.request();
    resolveFirst();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(20);

    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
