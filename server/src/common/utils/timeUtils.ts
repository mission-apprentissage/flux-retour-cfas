function getTimeNowFunc() {
  return new Date();
}

let getTimeFunc = getTimeNowFunc;

export function getCurrentTime(): Date {
  return getTimeFunc();
}

export function setTime(date: Date) {
  getTimeFunc = () => {
    return date;
  };
}

export function resetTime() {
  getTimeFunc = getTimeNowFunc;
}

export async function sleep(durationMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}
