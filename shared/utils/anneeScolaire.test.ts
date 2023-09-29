import { getAnneeScolaireFromDate, getAnneesScolaireListFromDate, getSIFADate } from "./anneeScolaire";

describe("getAnneesScolaireListFromDate()", () => {
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
      expect(getAnneesScolaireListFromDate(new Date(`${date}T00:00:00Z`))).toStrictEqual(expected);
    });
  });
});

describe("getAnneeScolaireFromDate()", () => {
  [
    { date: "2020-09-01", expected: "2020-2021" },
    { date: "2021-01-10", expected: "2020-2021" },
    { date: "2021-07-31", expected: "2020-2021" },
    { date: "2021-08-01", expected: "2021-2022" },
    { date: "2021-10-01", expected: "2021-2022" },
    { date: "2021-12-31", expected: "2021-2022" },
    { date: "2022-03-01", expected: "2021-2022" },
    { date: "2022-07-31", expected: "2021-2022" },
    { date: "2022-08-01", expected: "2022-2023" },
  ].forEach(({ date, expected }) => {
    it(`returns ${expected} for ${date}`, () => {
      expect(getAnneeScolaireFromDate(new Date(`${date}T00:00:00Z`))).toStrictEqual(expected);
    });
  });
});

describe("getSIFADate()", () => {
  [
    { date: "2020-09-01", expected: "2020" },
    { date: "2021-01-10", expected: "2020" },
    { date: "2021-07-31", expected: "2020" },
    { date: "2021-08-01", expected: "2021" },
    { date: "2021-10-01", expected: "2021" },
    { date: "2021-12-31", expected: "2021" },
    { date: "2022-03-01", expected: "2021" },
    { date: "2022-07-31", expected: "2021" },
    { date: "2022-08-01", expected: "2022" },
  ].forEach(({ date, expected }) => {
    it(`returns Date(${expected}-12-31) for ${date}`, () => {
      expect(getSIFADate(new Date(`${date}T00:00:00Z`))).toStrictEqual(new Date(`${expected}-12-31T23:59:59.999Z`));
    });
  });
});
