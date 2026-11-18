import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261118120100-unset-token-invitations-archive";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const archive = (email: string, extra: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  email,
  organisation_id: new ObjectId(),
  author_id: new ObjectId(),
  created_at: new Date("2025-06-26T10:00:00.000Z"),
  ...extra,
});

describe("migration unset-token-invitations-archive", () => {
  it("retire le jeton des invitations archivées sans toucher au reste", async () => {
    await getDatabase()
      .collection("invitationsArchive")
      .insertMany([archive("avec-jeton@cfa.fr", { token: "jeton" }), archive("sans-jeton@cfa.fr")], {
        bypassDocumentValidation: true,
      });

    await up(getDatabase());
    await up(getDatabase());

    const archives = await getDatabase()
      .collection("invitationsArchive")
      .find({}, { projection: { _id: 0, email: 1, token: 1 } })
      .sort({ email: 1 })
      .toArray();
    expect(archives).toEqual([{ email: "avec-jeton@cfa.fr" }, { email: "sans-jeton@cfa.fr" }]);
  });
});
