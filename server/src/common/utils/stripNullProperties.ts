export default function stripNullProperties<T>(obj: T): T {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result as T;
}
