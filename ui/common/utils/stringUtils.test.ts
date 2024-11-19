import { expect, it } from "vitest";

import { prettyFormatNumber } from "./stringUtils";

it("#prettyFormatNumber()", () => {
  [
    {
      input: 865,
      expected: "865",
    },
    {
      input: 13.13131313,
      expected: "13.1",
    },
    {
      input: 1049,
      expected: "1k",
    },
    {
      input: 1050,
      expected: "1.1k",
    },
    {
      input: 10050,
      expected: "10k",
    },
    {
      input: 49050,
      expected: "49k",
    },
  ].forEach(({ input, expected }) => {
    expect(prettyFormatNumber(input)).toStrictEqual(expected);
  });
});
