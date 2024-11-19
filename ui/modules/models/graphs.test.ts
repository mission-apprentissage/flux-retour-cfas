import { it, expect, describe } from "vitest";

import { calculateBins } from "./graphs";

const indicateurs = [
  1702, 123, 2227, 358, 51578, 32207, 2854, 38000, 44141, 24402, 36607, 31911, 33343, 40441, 28745, 747, 15976, 33456,
];

describe("calculateBins()", () => {
  it("create bins like metabase", () => {
    expect(calculateBins(indicateurs, 5, "#000000", "#ff0000")).toStrictEqual([
      {
        minValue: 0,
        maxValue: 10315.6,
        color: "#000000",
      },
      {
        minValue: 10315.6,
        maxValue: 20631.2,
        color: "#400000",
      },
      {
        minValue: 20631.2,
        maxValue: 30946.800000000003,
        color: "#800000",
      },
      {
        minValue: 30946.800000000003,
        maxValue: 41262.4,
        color: "#c00000",
      },
      {
        minValue: 41262.4,
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
