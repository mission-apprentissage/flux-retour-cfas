import { ObjectId } from "bson";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { sendBrevoEvent } from "@/common/services/brevo/brevo";
import { useMongo } from "@tests/jest/setupMongo";

import { buildOrgaMl, buildOrgaOf, buildUser } from "../contacts/fixtures";
import { isBrevoEventsActive, isBrevoMlGenericContactsActive } from "../contacts/sync-settings.actions";

import { trackBrevoEvent } from "./track";

// On mocke l'appel réseau Brevo ; `buildPayload` tourne en vrai contre le mongo mémoire.
vi.mock("@/common/services/brevo/brevo", () => ({
  sendBrevoEvent: vi.fn(),
}));
// Garde prod-only : par défaut active dans ces tests (config.env vaut "test" sinon).
vi.mock("../contacts/sync-settings.actions", () => ({
  isBrevoEventsActive: vi.fn().mockResolvedValue(true),
  isBrevoMlGenericContactsActive: vi.fn().mockResolvedValue(true),
}));

useMongo();

const sendMock = vi.mocked(sendBrevoEvent);
const isActiveMock = vi.mocked(isBrevoEventsActive);
const isMlGenericActiveMock = vi.mocked(isBrevoMlGenericContactsActive);

describe("trackBrevoEvent — account-confirmed", () => {
  beforeEach(() => {
    sendMock.mockReset();
    isActiveMock.mockReset();
    isActiveMock.mockResolvedValue(true);
  });

  it("construit le payload (email seul + event_date de confirmation) et envoie l'événement", async () => {
    const orga = buildOrgaOf();
    await organisationsDb().insertOne(orga as any);
    const confirmedAt = new Date("2026-01-15T10:00:00.000Z");
    const user = buildUser(orga, { account_status: "CONFIRMED", confirmed_at: confirmedAt });
    await usersMigrationDb().insertOne(user as any);

    await trackBrevoEvent("account-confirmed", { userId: user._id.toString() });

    expect(sendMock).toHaveBeenCalledOnce();
    const payload = sendMock.mock.calls[0][0];
    expect(payload.eventName).toBe("account_confirmed");
    expect(payload.identifiers).toEqual({ emailId: user.email });
    expect(payload.eventDate).toBe(confirmedAt.toISOString());
    expect(payload.eventProperties).toBeUndefined();
  });

  it("omet event_date si le compte n'a pas de confirmed_at", async () => {
    const orga = buildOrgaOf();
    await organisationsDb().insertOne(orga as any);
    const user = buildUser(orga, { account_status: "CONFIRMED" });
    await usersMigrationDb().insertOne(user as any);

    await trackBrevoEvent("account-confirmed", { userId: user._id.toString() });

    expect(sendMock.mock.calls[0][0].eventDate).toBeUndefined();
  });

  it("no-op si les événements sont inactifs / hors production (garde consumer)", async () => {
    isActiveMock.mockResolvedValue(false);
    const orga = buildOrgaOf();
    await organisationsDb().insertOne(orga as any);
    const user = buildUser(orga, { account_status: "CONFIRMED" });
    await usersMigrationDb().insertOne(user as any);

    await trackBrevoEvent("account-confirmed", { userId: user._id.toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("no-op si l'utilisateur est introuvable (buildPayload → null)", async () => {
    await trackBrevoEvent("account-confirmed", { userId: new ObjectId().toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("échoue pour une clé d'événement inconnue", async () => {
    await expect(trackBrevoEvent("unknown-event", { userId: new ObjectId().toString() })).rejects.toThrow(
      /Unknown Brevo event/
    );
  });
});

describe("trackBrevoEvent — account-confirmed-ml-generic", () => {
  const confirmedAt = new Date("2026-04-02T07:00:00.000Z");

  const seedMlUser = async (orgaOverride: Record<string, any> = {}, userOverride: Record<string, any> = {}) => {
    const orga = buildOrgaMl("ML NANTES", orgaOverride);
    await organisationsDb().insertOne(orga as any);
    const user = buildUser(orga, { account_status: "CONFIRMED", confirmed_at: confirmedAt, ...userOverride });
    await usersMigrationDb().insertOne(user as any);
    return user;
  };

  beforeEach(() => {
    sendMock.mockReset();
    isActiveMock.mockReset();
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockReset();
    isMlGenericActiveMock.mockResolvedValue(true);
  });

  it("cible l'adresse générique de la ML, avec la date de confirmation du compte", async () => {
    const user = await seedMlUser({ email: "Contact@ML-Nantes.fr" }, { email: "agent@ml-nantes.fr" });

    await trackBrevoEvent("account-confirmed-ml-generic", { userId: user._id.toString() });

    expect(sendMock).toHaveBeenCalledOnce();
    const payload = sendMock.mock.calls[0][0];
    // Même `eventName` que `account-confirmed` : capté par l'automation existante.
    expect(payload.eventName).toBe("account_confirmed");
    expect(payload.identifiers).toEqual({ emailId: "contact@ml-nantes.fr" });
    expect(payload.eventDate).toBe(confirmedAt.toISOString());
  });

  it("no-op si le toggle des contacts génériques ML est désactivé", async () => {
    isMlGenericActiveMock.mockResolvedValue(false);
    const user = await seedMlUser({ email: "contact@ml-nantes.fr" }, { email: "agent@ml-nantes.fr" });

    await trackBrevoEvent("account-confirmed-ml-generic", { userId: user._id.toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("no-op si la ML n'a pas d'adresse générique", async () => {
    const user = await seedMlUser({}, { email: "agent@ml-nantes.fr" });

    await trackBrevoEvent("account-confirmed-ml-generic", { userId: user._id.toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });

  // Doublon avec `account-confirmed`, qui cible déjà cette adresse.
  it("no-op si l'adresse générique est celle du compte confirmé", async () => {
    const user = await seedMlUser({ email: "contact@ml-nantes.fr" }, { email: "Contact@ML-Nantes.fr" });

    await trackBrevoEvent("account-confirmed-ml-generic", { userId: user._id.toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });

  // Le champ `email` n'existe que sur les organisations ML : un OF n'a de toute
  // façon pas d'adresse générique à cibler.
  it("no-op si l'organisation n'est pas une Mission Locale", async () => {
    const orga = buildOrgaOf();
    await organisationsDb().insertOne(orga as any);
    const user = buildUser(orga, { account_status: "CONFIRMED", confirmed_at: confirmedAt });
    await usersMigrationDb().insertOne(user as any);

    await trackBrevoEvent("account-confirmed-ml-generic", { userId: user._id.toString() });

    expect(sendMock).not.toHaveBeenCalled();
  });
});
