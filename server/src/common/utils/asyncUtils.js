import { isPlainObject, zipObject, keys, values, chunk } from "lodash-es";

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const chunkedAsyncForEach = async (array, callback, chunkSize = 10) => {
  const chunks = chunk(array, chunkSize);
  await asyncForEach(chunks, async (chunk) => {
    await Promise.all(
      chunk.map(async (item) => {
        await callback(item);
      })
    );
  });
};

export async function promiseAllProps(data) {
  if (isPlainObject(data)) {
    return zipObject(keys(data), await Promise.all(values(data)));
  }
  return Promise.all(data);
}

export function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
}

export function timeout(promise, millis) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(`Timed out after ${millis} ms.`), millis);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeout));
}

export function retry(callback, options = {}) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    async function execute(delay, maxRetries) {
      try {
        let res = await callback();
        resolve(res);
      } catch (e) {
        if (retries++ > maxRetries) {
          reject(e);
        } else {
          console.log(`Failed. Retrying in ${delay}ms...`);
          setTimeout(() => execute(delay, maxRetries), delay);
        }
      }
    }

    execute(options.delay || 1000, options.maxRetries || 2);
  });
}
