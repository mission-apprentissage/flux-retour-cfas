import { ObjectId } from "bson";
import { addJob } from "job-processor";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueBrevoContactSync, enqueueBrevoOrganisationContactSync } from "./enqueue-sync";
import { isBrevoInstantSyncActive, isBrevoMlGenericContactsActive } from "./sync-settings.actions";

vi.mock("job-processor", () => ({
  addJob: vi.fn(),
}));

vi.mock("./sync-settings.actions", () => ({
  isBrevoInstantSyncActive: vi.fn(),
  isBrevoMlGenericContactsActive: vi.fn(),
}));

const addJobMock = vi.mocked(addJob);
const isActiveMock = vi.mocked(isBrevoInstantSyncActive);
const isMlGenericActiveMock = vi.mocked(isBrevoMlGenericContactsActive);

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

describe("enqueueBrevoOrganisationContactSync", () => {
  beforeEach(() => {
    addJobMock.mockReset();
    isActiveMock.mockReset();
    isMlGenericActiveMock.mockReset();
  });

  it("enfile un job sync-one-organisation quand les deux toggles sont actifs", async () => {
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockResolvedValue(true);
    const organisationId = new ObjectId();

    await enqueueBrevoOrganisationContactSync(organisationId);

    expect(addJobMock).toHaveBeenCalledWith({
      name: "brevo-contacts:sync-one-organisation",
      payload: { organisationId: organisationId.toString() },
      queued: true,
    });
  });

  it("n'enfile rien si la synchro instantanée est désactivée", async () => {
    isActiveMock.mockResolvedValue(false);
    isMlGenericActiveMock.mockResolvedValue(true);

    await enqueueBrevoOrganisationContactSync(new ObjectId());

    expect(addJobMock).not.toHaveBeenCalled();
  });

  it("n'enfile rien si les contacts génériques ML sont désactivés", async () => {
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockResolvedValue(false);

    await enqueueBrevoOrganisationContactSync(new ObjectId());

    expect(addJobMock).not.toHaveBeenCalled();
  });

  it("ne propage pas l'erreur si addJob échoue (chemin critique protégé)", async () => {
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockResolvedValue(true);
    addJobMock.mockRejectedValue(new Error("job-processor down"));

    await expect(enqueueBrevoOrganisationContactSync(new ObjectId())).resolves.toBeUndefined();
  });
});
