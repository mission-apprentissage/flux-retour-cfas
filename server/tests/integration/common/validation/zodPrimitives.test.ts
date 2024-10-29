import { it, expect, describe } from "vitest";

import { primitivesV3 } from "@/common/validation/utils/zodPrimitives";

describe("Regex primitivesV3", () => {
  describe("derniere_situation", () => {
    it("should validate", () => {
      expect(primitivesV3.derniere_situation.safeParse(1009)).toStrictEqual({ success: true, data: 1009 });
      expect(primitivesV3.derniere_situation.safeParse("1009")).toStrictEqual({ success: true, data: 1009 });
    });
    it("should not validate", () => {
      expect(() => primitivesV3.derniere_situation.parse("word")).toThrow();
      expect(() => primitivesV3.derniere_situation.parse("1234word")).toThrow();
      expect(() => primitivesV3.derniere_situation.parse(1234)).toThrow();
      expect(() => primitivesV3.derniere_situation.parse(99837273)).toThrow();
      expect(() => primitivesV3.derniere_situation.parse(1)).toThrow();
    });
  });
});
