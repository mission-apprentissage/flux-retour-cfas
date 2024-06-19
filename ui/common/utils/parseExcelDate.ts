export default function parseExcelDate(input: number | string | undefined | null): string | null {
  if (!input) return null;

  if (typeof input === "number") {
    const excelBaseDate = new Date(Date.UTC(1899, 11, 30));
    const targetDate = new Date(excelBaseDate.getTime() + input * 24 * 60 * 60 * 1000);
    if (isNaN(targetDate.getTime())) {
      return null;
    }
    return targetDate.toISOString().split("T")[0];
  }

  const datePatterns = [
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: (match: RegExpMatchArray) => `${match[1]}-${match[2]}-${match[3]}` },
    {
      regex: /^(\d{2})\/(\d{2})\/(\d{4})$/,
      format: (match: RegExpMatchArray) => `${match[3]}-${match[2]}-${match[1]}`,
    },
    {
      regex: /^(\d{2})\/(\d{2})\/(\d{2})$/,
      format: (match: RegExpMatchArray) => {
        const year = parseInt(match[3], 10);
        const fullYear = year <= 40 ? 2000 + year : 1900 + year;
        return `${fullYear}-${match[2]}-${match[1]}`;
      },
    },
  ];

  for (const pattern of datePatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      const dateString = pattern.format(match);
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return dateString;
      }
    }
  }

  return null;
}
