export const OUI_NON = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];
export const toChecklist = (value: boolean | undefined) => (value === undefined ? [] : [value ? "oui" : "non"]);
export const fromChecklist = (values: string[]) => (values.length === 1 ? values[0] === "oui" : undefined);
export const withChoice = (label: string, emptyLabel: string) => (selected: string[]) =>
  selected.length === 1 ? `${label} : ${selected[0] === "oui" ? "Oui" : "Non"}` : emptyLabel;
