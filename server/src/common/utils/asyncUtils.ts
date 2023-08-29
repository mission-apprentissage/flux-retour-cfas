export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export function timeout(promise, millis) {
  const timeout = new Promise((resolve, reject) => setTimeout(() => reject(`Timed out after ${millis} ms.`), millis));
  // @ts-expect-error
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeout));
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
