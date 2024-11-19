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
