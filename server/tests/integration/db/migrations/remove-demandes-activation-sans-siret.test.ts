import { ObjectId } from "bson";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import { describe, expect, it } from "vitest";

import { demandesActivationCfaDb } from "@/common/model/collections";
import { up } from "@/db/migrations/20261102120000-remove-demandes-activation-sans-siret";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const insererDemande = async (siret: string, overrides: Partial<IDemandeActivationCfa> = {}) => {
  const _id = new ObjectId();
  await demandesActivationCfaDb().insertOne({
    _id,
    source: "Webinaire PdL",
    email_saisi: "direction@cfa-exemple.fr",
    email: "direction@cfa-exemple.fr",
    siret_saisi_brut: siret,
    siret_saisi: siret,
    siret: siret || null,
    motifs: siret ? [] : ["siret_mal_forme"],
    domaine_inconnu: false,
    branche: siret ? "activation" : "refus",
    branche_initiale: siret ? "activation" : "refus",
    a_envoyer: false,
    statut: "pret",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });
  return _id;
};

const existe = async (_id: ObjectId) => !!(await demandesActivationCfaDb().findOne({ _id }));

describe("migration remove-demandes-activation-sans-siret", () => {
  it("supprime les demandes importées sans SIRET et garde les autres", async () => {
    const sansSiret = await insererDemande("");
    const avecSiret = await insererDemande("13002374000439");
    const corrigee = await insererDemande("", { siret_corrige: "13002374000439" });
    const envoyee = await insererDemande("", { statut: "envoyee" });

    await up();

    expect(await existe(sansSiret)).toBe(false);
    expect(await existe(avecSiret)).toBe(true);
    expect(await existe(corrigee)).toBe(true);
    expect(await existe(envoyee)).toBe(true);
  });
});
