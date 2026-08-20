export type StepId =
  | "situation"
  | "risqueRupture"
  | "maintienFormation"
  | "datesRupture"
  | "rentreeSansContrat"
  | "objectifs"
  | "contact"
  | "recap";

export const STEP_NUMBER: Record<StepId, 1 | 2 | 3> = {
  situation: 1,
  risqueRupture: 1,
  maintienFormation: 1,
  datesRupture: 1,
  rentreeSansContrat: 1,
  objectifs: 2,
  contact: 3,
  recap: 3,
};
