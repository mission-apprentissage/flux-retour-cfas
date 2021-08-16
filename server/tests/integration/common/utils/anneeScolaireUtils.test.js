const assert = require("assert").strict;
const { getAnneeScolaireFromDate } = require("../../../../src/common/utils/anneeScolaireUtils");

describe("anneeScolaireUtils", () => {
  describe("getAnneeScolaireFromDate", () => {
    [
      { date: new Date("2020-09-01T00:00:00.000Z"), expectedAnneeScolaire: "2020-2021" },
      { date: new Date("2021-01-10T00:00:00.000Z"), expectedAnneeScolaire: "2020-2021" },
      { date: new Date("2021-07-31T00:00:00.000Z"), expectedAnneeScolaire: "2020-2021" },
      { date: new Date("2021-08-01T00:00:00.000Z"), expectedAnneeScolaire: "2021-2022" },
      { date: new Date("2021-10-01T00:00:00.000Z"), expectedAnneeScolaire: "2021-2022" },
      { date: new Date("2021-12-31T00:00:00.000Z"), expectedAnneeScolaire: "2021-2022" },
      { date: new Date("2022-03-01T00:00:00.000Z"), expectedAnneeScolaire: "2021-2022" },
      { date: new Date("2022-07-31T00:00:00.000Z"), expectedAnneeScolaire: "2021-2022" },
      { date: new Date("2022-08-01T00:00:00.000Z"), expectedAnneeScolaire: "2022-2023" },
    ].forEach(({ date, expectedAnneeScolaire }) => {
      it(`returns ${expectedAnneeScolaire} for ${date.toLocaleDateString()}`, () => {
        assert.equal(expectedAnneeScolaire, getAnneeScolaireFromDate(date));
      });
    });
  });
});
