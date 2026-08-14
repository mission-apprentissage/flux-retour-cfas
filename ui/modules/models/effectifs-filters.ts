function parseQueryField(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return value.split(",");
}

export function parseQueryFieldDate(value: string | string[] | undefined): Date {
  return new Date(parseQueryField(value)[0] ?? Date.now());
}

export function convertDateFiltersToQuery(date: Date | undefined | null) {
  return date?.toISOString();
}
