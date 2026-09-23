const tickIncrement = (max: number, count: number) => {
  const step = max / count;
  const power = Math.floor(Math.log10(step));
  const error = step / 10 ** power;
  const factor = error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1;
  return factor * 10 ** power;
};

const range = (max: number, step: number): number[] => {
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 1e-9; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  return ticks;
};

export const ticksUpTo = (max: number, count: number, minStep = 0): number[] => {
  if (max <= 0) return [0];
  return range(max, Math.max(tickIncrement(max, count), minStep));
};

export const niceTicks = (max: number, count: number): number[] => {
  if (max <= 0) return [0, 1];
  let niceMax = max;
  for (let i = 0; i < 10; i++) {
    const next = Math.ceil(niceMax / tickIncrement(niceMax, count)) * tickIncrement(niceMax, count);
    if (next === niceMax) break;
    niceMax = next;
  }
  return range(niceMax, tickIncrement(niceMax, count));
};
