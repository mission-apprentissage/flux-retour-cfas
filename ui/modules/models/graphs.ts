export interface Bin {
  minValue: number;
  maxValue: number;
  color: string;
}

export function calculateBins(data: number[], numberOfBuckets: number, minColor: string, maxColor: string): Bin[] {
  const sortedData = [...data].sort((a, b) => a - b);
  const dataMin = sortedData[0];
  const dataMax = sortedData[sortedData.length - 1];
  const binSize = (dataMax - dataMin) / numberOfBuckets;

  const bins = Array.from({ length: numberOfBuckets }, (_, i) => {
    const minValue: number = dataMin + i * binSize;
    const maxValue: number = minValue + binSize;

    const ratio: number = i / (numberOfBuckets - 1);
    const color: string = interpolateColor(minColor, maxColor, ratio);

    return { minValue, maxValue, color };
  });
  // borne min à zéro pour un meilleur affichage
  bins[0].minValue = 0;
  return bins;
}

// Fonction pour interpoler les couleurs
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const r = Math.ceil(parseInt(color1.slice(1, 3), 16) * (1 - ratio) + parseInt(color2.slice(1, 3), 16) * ratio);
  const g = Math.ceil(parseInt(color1.slice(3, 5), 16) * (1 - ratio) + parseInt(color2.slice(3, 5), 16) * ratio);
  const b = Math.ceil(parseInt(color1.slice(5, 7), 16) * (1 - ratio) + parseInt(color2.slice(5, 7), 16) * ratio);

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function hex(i: number): string {
  return `${i < 16 ? "0" : ""}${i.toString(16)}`;
}
