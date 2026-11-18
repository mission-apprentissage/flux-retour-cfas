import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261118120000-rattrapage-expiration-invitations";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const invitation = (token: string, dates: Record<string, Date>) => ({
  _id: new ObjectId(),
  token,
  email: `${token}@cfa.fr`,
  organisation_id: new ObjectId(),
  author_id: new ObjectId(),
  ...dates,
});

describe("migration rattrapage-expiration-invitations", () => {
  it("pose expires_at 96 h après created_at sans toucher aux invitations qui en ont une", async () => {
    await getDatabase()
      .collection("invitations")
      .insertMany(
        [
          invitation("sans-date", { created_at: new Date("2023-05-09T10:00:00.000Z") }),
          invitation("avec-date", {
            created_at: new Date("2026-11-01T10:00:00.000Z"),
            expires_at: new Date("2026-11-20T10:00:00.000Z"),
          }),
        ],
        { bypassDocumentValidation: true }
      );

    await up(getDatabase());
    await up(getDatabase());

    const expirations = await getDatabase()
      .collection("invitations")
      .find({}, { projection: { _id: 0, token: 1, expires_at: 1 } })
      .sort({ token: 1 })
      .toArray();
    expect(expirations).toEqual([
      { token: "avec-date", expires_at: new Date("2026-11-20T10:00:00.000Z") },
      { token: "sans-date", expires_at: new Date("2023-05-13T10:00:00.000Z") },
    ]);
  });
});
