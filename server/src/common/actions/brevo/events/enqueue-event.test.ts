import { addJob } from "job-processor";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { isBrevoEventsActive } from "../contacts/sync-settings.actions";

import { enqueueBrevoEvent } from "./enqueue-event";

vi.mock("job-processor", () => ({
  addJob: vi.fn(),
}));

vi.mock("../contacts/sync-settings.actions", () => ({
  isBrevoEventsActive: vi.fn(),
}));

const addJobMock = vi.mocked(addJob);
const isActiveMock = vi.mocked(isBrevoEventsActive);

describe("enqueueBrevoEvent", () => {
  beforeEach(() => {
    addJobMock.mockReset();
    isActiveMock.mockReset();
  });

  it("n'enfile aucun job quand les événements sont désactivés (ou hors prod)", async () => {
    isActiveMock.mockResolvedValue(false);

    await enqueueBrevoEvent("account-confirmed", { userId: "user-1" });

    expect(addJobMock).not.toHaveBeenCalled();
  });

  it("enfile un job brevo-events:track avec le bon payload quand actif", async () => {
    isActiveMock.mockResolvedValue(true);

    await enqueueBrevoEvent("account-confirmed", { userId: "user-1" });

    expect(addJobMock).toHaveBeenCalledOnce();
    expect(addJobMock).toHaveBeenCalledWith({
      name: "brevo-events:track",
      payload: { key: "account-confirmed", userId: "user-1" },
      queued: true,
    });
  });

  it("ne propage pas l'erreur si addJob échoue (chemin critique protégé)", async () => {
    isActiveMock.mockResolvedValue(true);
    addJobMock.mockRejectedValue(new Error("job-processor down"));

    await expect(enqueueBrevoEvent("account-confirmed", { userId: "user-1" })).resolves.toBeUndefined();
  });
});
