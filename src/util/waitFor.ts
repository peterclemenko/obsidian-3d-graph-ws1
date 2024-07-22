export function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * wait for a condition to be true
 */
export function waitFor(
  callback: () => boolean,
  {
    timeout = 30000,
    interval = 100,
  }: {
    timeout?: number;
    interval?: number;
  }
): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      if (callback()) {
        clearInterval(intervalId);
        resolve();
      }
      if (Date.now() - startTime >= timeout) {
        // timeout
        clearInterval(intervalId);
        resolve();
      }
    }, interval);
  });
}

export function waitForStable<T = unknown>(
  accessor: () => T,
  {
    timeout = 30000,
    minDelay = 100,
    interval = 100,
    rehitCount = 3,
  }: {
    /**
     * at most wait for timeout milliseconds
     */
    timeout?: number;
    /**
     * start after reaching minDelay
     */
    minDelay?: number;
    /**
     * check every interval milliseconds
     */
    interval?: number;
    /**
     * number of time the value need to be the same before resolving
     */
    rehitCount?: number;
  }
) {
  let previousValue = accessor();
  let hitCount = 0;
  const startTime = Date.now();
  return new Promise<T | undefined>((resolve) => {
    const intervalId = setInterval(() => {
      const currentValue = accessor();

      if (Date.now() - startTime >= timeout) {
        // timeout
        clearInterval(intervalId);
        resolve(undefined);
      }

      if (currentValue === previousValue) {
        hitCount += 1;
      } else {
        hitCount = 0;
        previousValue = currentValue;
      }

      if (
        hitCount >= rehitCount &&
        currentValue === previousValue &&
        Date.now() - startTime >= minDelay
      ) {
        clearInterval(intervalId);
        resolve(currentValue);
      }
    }, interval);
  });
}
