import { calculateBins } from "./graphs";

const indicateurs = [
  1702, 123, 2227, 358, 51578, 32207, 2854, 38000, 44141, 24402, 36607, 31911, 33343, 40441, 28745, 747, 15976, 33456,
];

describe("calculateBins()", () => {
  it("create bins like metabase", () => {
    expect(calculateBins(indicateurs, 5, "#000000", "#ff0000")).toStrictEqual([
      {
        minValue: 0,
        maxValue: 10414,
        color: "#000000",
      },
      {
        minValue: 10414,
        maxValue: 20705,
        color: "#400000",
      },
      {
        minValue: 20705,
        maxValue: 30996,
        color: "#800000",
      },
      {
        minValue: 30996,
        maxValue: 41287,
        color: "#c00000",
      },
      {
        minValue: 41287,
        maxValue: 51578,
        color: "#ff0000",
      },

      // metabase
      // {
      //   minValue: 123,
      //   maxValue: 2854,
      //   color: "#000000",
      // },
      // {
      //   minValue: 15976,
      //   maxValue: 24402,
      //   color: "#400000",
      // },
      // {
      //   minValue: 28745,
      //   maxValue: 33456,
      //   color: "#800000",
      // },
      // {
      //   minValue: 36607,
      //   maxValue: 44141,
      //   color: "#c00000",
      // },
      // {
      //   minValue: 51578,
      //   maxValue: Infinity,
      //   color: "#ff0000",
      // },
    ]);
  });
});
