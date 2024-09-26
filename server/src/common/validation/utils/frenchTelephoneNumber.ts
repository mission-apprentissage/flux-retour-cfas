export const telephoneConverter = (telephone: string | null | undefined) =>
  telephone
    ?.toString()
    .trim()
    .replace(/[-.()\s]/g, "") ?? telephone;
