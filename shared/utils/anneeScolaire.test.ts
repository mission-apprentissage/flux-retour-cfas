import { it, expect, describe } from "vitest";

import {
  getAnneeScolaireFromDate,
  getAnneeScolaireListFromDateRange,
  getAnneesScolaireListFromDate,
} from "./anneeScolaire";

describe("getAnneesScolaireListFromDateRange()", () => {
  [
    { start: "2025-01-01", end: "2026-01-02", expected: ["2024-2025", "2025-2025", "2025-2026", "2026-2026"] },
    { start: "2020-09-01", end: "2020-09-30", expected: ["2020-2020", "2020-2021"] },
    { start: "2025-01-01", end: "2025-07-31", expected: ["2024-2025", "2025-2025"] },
    { start: "2025-01-01", end: "2025-08-02", expected: ["2024-2025", "2025-2025", "2025-2026"] },
    {
      start: "2020-01-10",
      end: "2025-01-31",
      expected: [
        "2019-2020",
        "2020-2020",
        "2020-2021",
        "2021-2021",
        "2021-2022",
        "2022-2022",
        "2022-2023",
        "2023-2023",
        "2023-2024",
        "2024-2024",
        "2024-2025",
        "2025-2025",
      ],
    },
    {
      start: "2020-01-10",
      end: "2025-08-31",
      expected: [
        "2019-2020",
        "2020-2020",
        "2020-2021",
        "2021-2021",
        "2021-2022",
        "2022-2022",
        "2022-2023",
        "2023-2023",
        "2023-2024",
        "2024-2024",
        "2024-2025",
        "2025-2025",
        "2025-2026",
      ],
    },
    {
      start: "2020-08-10",
      end: "2025-01-31",
      expected: [
        "2020-2020",
        "2020-2021",
        "2021-2021",
        "2021-2022",
        "2022-2022",
        "2022-2023",
        "2023-2023",
        "2023-2024",
        "2024-2024",
        "2024-2025",
        "2025-2025",
      ],
    },
    {
      start: "2020-08-10",
      end: "2025-08-31",
      expected: [
        "2020-2020",
        "2020-2021",
        "2021-2021",
        "2021-2022",
        "2022-2022",
        "2022-2023",
        "2023-2023",
        "2023-2024",
        "2024-2024",
        "2024-2025",
        "2025-2025",
        "2025-2026",
      ],
    },
  ].forEach(({ start, end, expected }) => {
    it(`returns [${expected.join(", ")}] for ${start} to ${end}`, () => {
      expect(
        getAnneeScolaireListFromDateRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`))
      ).toStrictEqual(expected);
    });
  });
});

describe("getAnneeScolaire()", () => {
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
