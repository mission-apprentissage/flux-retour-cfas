import { ObjectId } from "bson";
import { addJob } from "job-processor";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueBrevoContactSync } from "./enqueue-sync";
import { isBrevoInstantSyncActive } from "./sync-settings.actions";

vi.mock("job-processor", () => ({
  addJob: vi.fn(),
}));

vi.mock("./sync-settings.actions", () => ({
  isBrevoInstantSyncActive: vi.fn(),
}));

const addJobMock = vi.mocked(addJob);
const isActiveMock = vi.mocked(isBrevoInstantSyncActive);

describe("enqueueBrevoContactSync", () => {
  beforeEach(() => {
    addJobMock.mockReset();
    isActiveMock.mockReset();
  });

  it("n'enfile aucun job quand la synchro instantanée est désactivée", async () => {
    isActiveMock.mockResolvedValue(false);

    await enqueueBrevoContactSync(new ObjectId());

    expect(addJobMock).not.toHaveBeenCalled();
  });

  it("enfile un job sync-one avec le bon payload quand la synchro est active", async () => {
    isActiveMock.mockResolvedValue(true);
    const userId = new ObjectId();

    await enqueueBrevoContactSync(userId);

    expect(addJobMock).toHaveBeenCalledOnce();
    expect(addJobMock).toHaveBeenCalledWith({
      name: "brevo-contacts:sync-one",
      payload: { userId: userId.toString() },
      queued: true,
    });
  });

  it("ne propage pas l'erreur si addJob échoue (chemin critique protégé)", async () => {
    isActiveMock.mockResolvedValue(true);
    addJobMock.mockRejectedValue(new Error("job-processor down"));

    await expect(enqueueBrevoContactSync(new ObjectId())).resolves.toBeUndefined();
  });
});
