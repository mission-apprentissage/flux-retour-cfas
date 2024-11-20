import { it, expect, describe } from "vitest";

import parseExcelBoolean from "./parseExcelBoolean";

describe("parseExcelBoolean", () => {
  it("returns null for null input", () => {
    expect(parseExcelBoolean(null)).toBeNull();
  });
  it("returns null for non-boolean string input", () => {
    expect(parseExcelBoolean("foo")).toBeNull();
  });
  it("returns boolean from number", () => {
    expect(parseExcelBoolean(1)).toBe(true);
    expect(parseExcelBoolean(0)).toBe(false);
  });
  it("returns boolean from boolean", () => {
    expect(parseExcelBoolean(true)).toBe(true);
    expect(parseExcelBoolean(false)).toBe(false);
  });
  it("returns boolean from string", () => {
    expect(parseExcelBoolean("1")).toBe(true);
    expect(parseExcelBoolean("0")).toBe(false);
    expect(parseExcelBoolean("oui")).toBe(true);
    expect(parseExcelBoolean("non")).toBe(false);
    expect(parseExcelBoolean("vrai")).toBe(true);
    expect(parseExcelBoolean("faux")).toBe(false);
    expect(parseExcelBoolean("OUI")).toBe(true);
    expect(parseExcelBoolean("NON")).toBe(false);
    expect(parseExcelBoolean("VRAI")).toBe(true);
    expect(parseExcelBoolean("FAUX")).toBe(false);
  });
});
