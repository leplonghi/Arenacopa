export function createAsyncRefreshScheduler(
  refresh: () => Promise<void>,
  options: { delayMs?: number } = {},
) {
  const delayMs = options.delayMs ?? 75;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let queued = false;
  let disposed = false;

  const clearPendingTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const run = async () => {
    timeoutId = null;
    if (disposed) return;

    running = true;
    try {
      await refresh();
    } finally {
      running = false;
      if (queued && !disposed) {
        queued = false;
        request();
      }
    }
  };

  const request = () => {
    if (disposed) return;
    if (running) {
      queued = true;
      return;
    }
    if (timeoutId) return;

    timeoutId = setTimeout(() => {
      void run();
    }, delayMs);
  };

  const dispose = () => {
    disposed = true;
    queued = false;
    clearPendingTimer();
  };

  return {
    dispose,
    request,
  };
}
