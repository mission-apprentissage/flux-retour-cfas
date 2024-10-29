import { it, expect, describe } from "vitest";

import parseExcelDate from "./parseExcelDate";

describe("parseExcelDate", () => {
  it("returns null for null input", () => {
    expect(parseExcelDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseExcelDate(undefined)).toBeNull();
  });

  it("returns null for non-date string input", () => {
    expect(parseExcelDate("foo")).toBeNull();
  });

  it("returns date form number", () => {
    expect(parseExcelDate(54321)).toBe("2048-09-20");
  });

  it("returns date from YYYY-MM-DD string", () => {
    expect(parseExcelDate("2048-09-20")).toBe("2048-09-20");
  });

  it("returns date from DD/MM/YYYY string", () => {
    expect(parseExcelDate("20/09/2048")).toBe("2048-09-20");
  });

  it("returns date from DD/MM/YY string (after 40)", () => {
    expect(parseExcelDate("20/09/48")).toBe("1948-09-20");
  });

  it("returns date from DD/MM/YY string (before 40)", () => {
    expect(parseExcelDate("20/09/38")).toBe("2038-09-20");
  });
});
