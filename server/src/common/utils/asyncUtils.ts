export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export function timeout(promise, millis) {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(`Timed out after ${millis} ms.`), millis);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

export async function sleep(durationMs: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve) => {
    let timeout: NodeJS.Timeout | null = null;

    const listener = () => {
      if (timeout) clearTimeout(timeout);
      resolve();
    };

    timeout = setTimeout(() => {
      signal?.removeEventListener("abort", listener);
      resolve();
    }, durationMs);

    signal?.addEventListener("abort", listener);
  });
}
