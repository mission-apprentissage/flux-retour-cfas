import { getAnneesScolaireListFromDate } from "./anneeScolaire";

describe("deducation années scolaires en cours à partir d'une date", () => {
  [
    { date: "2020-09-01", expected: ["2020-2020", "2020-2021"] },
    { date: "2021-01-10", expected: ["2021-2021", "2020-2021"] },
    { date: "2021-07-31", expected: ["2021-2021", "2020-2021"] },
    { date: "2021-08-01", expected: ["2021-2021", "2021-2022"] },
    { date: "2021-10-01", expected: ["2021-2021", "2021-2022"] },
    { date: "2021-12-31", expected: ["2021-2021", "2021-2022"] },
    { date: "2022-03-01", expected: ["2022-2022", "2021-2022"] },
    { date: "2022-07-31", expected: ["2022-2022", "2021-2022"] },
    { date: "2022-08-01", expected: ["2022-2022", "2022-2023"] },
  ].forEach(({ date, expected }) => {
    it(`returns [${expected.join(", ")}] for ${date}`, () => {
      expect(getAnneesScolaireListFromDate(new Date(`${date}T00:00:00.000Z`))).toStrictEqual(expected);
    });
  });
});
