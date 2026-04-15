import { describe, expect, it } from "vitest";

import { getInitials, getUserDisplayName, isCurrentUserId } from "./user.utils";

describe("getInitials", () => {
  it("returns initials from prenom and nom", () => {
    expect(getInitials("Dupont", "Jean")).toBe("J.D");
  });

  it("returns prenom initial only when nom is missing", () => {
    expect(getInitials(null, "Jean")).toBe("J.");
  });

  it("returns nom initial only when prenom is missing", () => {
    expect(getInitials("Dupont", null)).toBe(".D");
  });

  it("returns ? when both are missing", () => {
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials(undefined, undefined)).toBe("?");
  });

  it("handles empty strings", () => {
    expect(getInitials("", "")).toBe("?");
  });
});

describe("getUserDisplayName", () => {
  it("returns full name", () => {
    expect(getUserDisplayName({ prenom: "Jean", nom: "Dupont" })).toBe("Jean Dupont");
  });

  it("returns prenom only when nom is missing", () => {
    expect(getUserDisplayName({ prenom: "Jean", nom: null })).toBe("Jean");
  });

  it("returns empty string for null user", () => {
    expect(getUserDisplayName(null)).toBe("");
    expect(getUserDisplayName(undefined)).toBe("");
  });
});

describe("isCurrentUserId", () => {
  it("returns true for matching string IDs", () => {
    expect(isCurrentUserId("abc123", "abc123")).toBe(true);
  });

  it("returns false for different IDs", () => {
    expect(isCurrentUserId("abc123", "def456")).toBe(false);
  });

  it("returns false when either ID is null/undefined", () => {
    expect(isCurrentUserId(null, "abc123")).toBe(false);
    expect(isCurrentUserId("abc123", null)).toBe(false);
    expect(isCurrentUserId(null, null)).toBe(false);
  });

  it("compares via toString for ObjectId-like objects", () => {
    const obj1 = { toString: () => "abc123" };
    const obj2 = { toString: () => "abc123" };
    expect(isCurrentUserId(obj1, obj2)).toBe(true);
  });
});
