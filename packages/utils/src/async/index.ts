function createTimeoutError(message?: string): Error {
  const err = new Error(message);
  err.name = "TimeoutError";
  return err;
}

/**
 * Delay for `milliseconds`
 * @param milliseconds
 */
export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * A simple {@link Promise.race} implementation,
 * to avoid incompatible Promise.race running in earlier JavaScript runtime.
 * @param promises
 */
export function race<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    promises.forEach((promise) => {
      promise.then(resolve, reject);
    });
  });
}

export interface TimeoutOptions {
  milliseconds?: number;
  message?: string | Error;
}

/**
 * Timeout a promise after `milliseconds`
 * @param promise
 * @param options
 */
export function timeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions | number = {}
): Promise<T> {
  const milliseconds: number =
    typeof options === "number" ? options : options.milliseconds ?? 1000;
  const message = typeof options === "number" ? undefined : options.message;

  return new Promise((resolve, reject) => {
    const timeoutTask = setTimeout(() => {
      reject(message instanceof Error ? message : createTimeoutError(message));
    }, milliseconds);

    promise.then(
      (value) => {
        clearTimeout(timeoutTask);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutTask);
        reject(error);
      }
    );
  });
}

export interface RetryOptions {
  retries?: number;
  timeout?: number;
  delay?: number;
}

/**
 * Retry a promise
 * @param run
 * @param options
 */
export function retry<T>(
  run: () => T | Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 10,
    timeout: timeoutMs = 1000,
    delay: delayMs = 0,
  } = options;

  let currentRetryTimes = 0;

  const retryPromise = new Promise<T>((resolve, reject) => {
    function handleError(err: unknown) {
      if (currentRetryTimes > retries) {
        reject(err);
        return;
      }

      currentRetryTimes++;

      if (delayMs) {
        delay(delayMs).then(retryRun);
      } else {
        retryRun();
      }
    }

    function retryRun() {
      try {
        Promise.resolve(run()).then(resolve, handleError);
      } catch (err) {
        handleError(err);
      }
    }

    retryRun();
  });

  return timeout(retryPromise, { milliseconds: timeoutMs });
}
