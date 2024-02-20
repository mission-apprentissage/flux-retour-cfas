export async function sleep(durationMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}

export function stripEmptyFields<T extends object>(object: T): T {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined" && value !== null && value !== "") {
      acc[key] = value?.constructor?.name === "Object" ? stripEmptyFields(value) : value;
    }
    return acc;
  }, {}) as T;
}

export const getNestedValue = (obj: Record<string, any>, path: string) =>
  path.split(".").reduce((acc, part) => acc && acc[part], obj);
