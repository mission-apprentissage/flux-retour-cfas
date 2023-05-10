import { calculateBins, colorData } from "./indicateurs";

const indicateurs = [
  1702, 123, 2227, 358, 51578, 32207, 2854, 38000, 44141, 24402, 36607, 31911, 33343, 40441, 28745, 747, 15976, 33456,
];

describe("calculateBins()", () => {
  it("create bins like metabase", () => {
    expect(calculateBins(indicateurs, 5, "#000000", "#ff0000")).toStrictEqual([
      {
        minValue: 123,
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

// describe("colorData()", () => {
//   it("assigne la bonne couleur", () => {
//     expect(
//       colorData(
//         indicateurs.map((value) => ({ value })),
//         5,
//         "#000000",
//         "#ff0000"
//       )
//     ).toStrictEqual([
//       { value: 123, color: "#000000" },
//       { value: 358, color: "#000000" },
//       { value: 747, color: "#000000" },
//       { value: 1702, color: "#000000" },
//       { value: 2227, color: "#000000" },
//       { value: 2854, color: "#000000" },
//       { value: 15976, color: "#400000" },
//       { value: 24402, color: "#800000" },
//       { value: 28745, color: "#800000" },
//       { value: 31911, color: "#c00000" },
//       { value: 32207, color: "#c00000" },
//       { value: 33343, color: "#c00000" },
//       { value: 33456, color: "#c00000" },
//       { value: 36607, color: "#c00000" },
//       { value: 38000, color: "#c00000" },
//       { value: 40441, color: "#c00000" },
//       { value: 44141, color: "#f00000" },
//       { value: 51578, color: "#f00000" },
//     ]);
//   });
// });
