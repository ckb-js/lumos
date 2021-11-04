import Queue from "./queue";

export type resolveType = (result: unknown) => void;

export default function pLimit(concurrency: number) {
  if (
    !(
      (Number.isInteger(concurrency) ||
        concurrency === Number.POSITIVE_INFINITY) &&
      concurrency > 0
    )
  ) {
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
  }

  const queue = new Queue();
  let activeCount = 0;

  const next = () => {
    activeCount--;

    if (queue.size > 0) {
      // TODO refine type
      // @ts-ignore:
      queue.dequeue()();
    }
  };

  const run = async (
    fn: () => void,
    resolve: (result: unknown) => void,
    args: unknown[]
  ) => {
    activeCount++;
    // TODO refine type
    // @ts-ignore:
    const result = (async () => fn(...args))();

    resolve(result);

    try {
      await result;
    } catch {}

    next();
  };

  const enqueue = (fn: () => void, resolve: resolveType, args: unknown[]) => {
    queue.enqueue(run.bind(undefined, fn, resolve, args));

    (async () => {
      // This function needs to wait until the next microtask before comparing
      // `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
      // when the run function is dequeued and called. The comparison in the if-statement
      // needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
      await Promise.resolve();

      if (activeCount < concurrency && queue.size > 0) {
        // TODO refine type
        // @ts-ignore:
        queue.dequeue()();
      }
    })();
  };

  const generator = (fn: () => void, ...args: unknown[]) =>
    new Promise((resolve: resolveType) => {
      enqueue(fn, resolve, args);
    });

  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount,
    },
    pendingCount: {
      get: () => queue.size,
    },
    clearQueue: {
      value: () => {
        queue.clear();
      },
    },
  });

  return generator;
}
