import { strict as assert } from "assert";

import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";

describe("anneeScolaireUtils", () => {
  describe("getAnneesScolaireListFromDate", () => {
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
        assert.deepStrictEqual(getAnneesScolaireListFromDate(new Date(`${date}T00:00:00.000Z`)), expected);
      });
    });
  });
});
