import { strict as assert } from "assert";

import { vi, it, describe } from "vitest";

import { getNiveauFormationLibelle } from "@/common/actions/formations.actions";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: {
    certification: {
      index: vi.fn(),
    },
  },
}));

describe("Tests des actions Formations", () => {
  useNock();
  useMongo();

  describe("getNiveauFormationFromLibelle", () => {
    it("should return null when passed null", () => {
      assert.equal(getNiveauFormationLibelle(null), null);
    });

    it("should return null when passed empty undefined", () => {
      assert.equal(getNiveauFormationLibelle(undefined), null);
    });

    it.each([
      ["1", null],
      ["2", null],
      ["3", "3 (CAP...)"],
      ["4", "4 (BAC...)"],
      ["5", "5 (BTS, DEUST...)"],
      ["6", "6 (Licence, BUT...)"],
      ["7", "7 (Master, titre ingénieur...)"],
      ["8", "8 (Doctorat...)"],
    ])("should return %s when passed %s", (niveau, expected) => {
      assert.equal(getNiveauFormationLibelle(niveau), expected);
    });
  });
});
