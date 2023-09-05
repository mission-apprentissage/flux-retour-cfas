export default function parseExcelDate(input: number | string | undefined | null): string | null {
  if (!input) return null; // We consider all falsy values as null
  // If it's a number, treat it as an Excel date
  if (typeof input === "number") {
    const excelBaseDate = new Date(Date.UTC(1899, 11, 30)); // Excel's base date is 1899-12-30 (lol).
    const targetDate = new Date(excelBaseDate.getTime() + input * 24 * 60 * 60 * 1000);
    return targetDate.toISOString().split("T")[0]; // Return the date part of the ISO string
  }

  // Handle string input
  let match;
  if ((match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  } else if ((match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  } else if ((match = input.match(/^(\d{2})\/(\d{2})\/(\d{2})$/))) {
    const year = parseInt(match[3], 10);
    // Handle year '00' to '99', assuming '00' to '40' belongs to 2000s and '41' to '99' belongs to 1900s.
    const fullYear = year <= 40 ? 2000 + year : 1900 + year;
    return `${fullYear}-${match[2]}-${match[1]}`;
  }

  return null; // return null for unrecognized format
}
