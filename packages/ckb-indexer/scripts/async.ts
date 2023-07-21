async function timeout<T>(promise: Promise<T>, timeout?: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);
    }),
  ]);
}

async function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export async function waitFor<T>(
  action: () => Promise<T>,
  options?: {
    name?: string;
    timeoutMs?: number;
    intervalMs?: number;
  }
): Promise<T> {
  const { timeoutMs = 3000, intervalMs = 500, name = "Task" } = options || {};
  let lastErr: unknown;

  const retryTask = new Promise<T>(async (resolve) => {
    while (true) {
      const last = Date.now();
      try {
        const result = await timeout(action(), intervalMs);
        resolve(result);
        break;
      } catch (err) {
        lastErr = err;
        await sleep(Date.now() - last < intervalMs ? intervalMs : 0);
      }
    }
  });

  return timeout(retryTask, timeoutMs).catch((err) => {
    throw new Error(`${name} failed after ${timeoutMs}ms: ${lastErr || err}`);
  });
}
