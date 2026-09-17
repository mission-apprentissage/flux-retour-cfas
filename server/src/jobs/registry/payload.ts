type JobPayload = Record<string, unknown> | null | undefined;

export const payloadString = (payload: JobPayload, key: string): string | undefined => {
  const value = payload?.[key];
  return typeof value === "string" && value !== "" ? value : undefined;
};

export const requirePayloadString = (payload: JobPayload, key: string): string => {
  const value = payloadString(payload, key);
  if (value === undefined) {
    throw new Error(`Paramètre "${key}" manquant`);
  }
  return value;
};

export const payloadNumber = (payload: JobPayload, key: string): number | undefined => {
  const value = payload?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
};

export const payloadBoolean = (payload: JobPayload, key: string): boolean | undefined => {
  const value = payload?.[key];
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const payloadDate = (payload: JobPayload, key: string): Date | undefined => {
  const value = payload?.[key];
  if (value instanceof Date) return value;
  if (typeof value === "string" && value !== "") return new Date(value);
  return undefined;
};
