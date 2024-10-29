import { it, expect } from "vitest";

import { getUniquesMonthAndYearFromDatesList } from "./dateUtils";

it("renvoie un tableau de mois uniques", () => {
  const input = [
    { date: new Date("2022-01-20") },
    { date: new Date("2022-01-10") },
    { date: new Date("2022-01-15") },
    { date: new Date("2022-02-13") },
    { date: new Date("2022-03-01") },
    { date: new Date("2023-03-01") },
  ];
  const output = getUniquesMonthAndYearFromDatesList(input);
  expect(output).toEqual([
    new Date("2022-01-20"),
    new Date("2022-02-13"),
    new Date("2022-03-01"),
    new Date("2023-03-01"),
  ]);
});
