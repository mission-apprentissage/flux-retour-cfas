import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import { describe, expect, it } from "vitest";

import { createFranceTravailEffectifSnapshot } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { franceTravailEffectifsDb } from "@/common/model/collections";
import { dedupeInscritSansContrat } from "@/jobs/hydrate/france-travail/hydrate-france-travail";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const identite = { nom: "DUPONT", prenom: "Jean", date_de_naissance: new Date("2000-01-15T00:00:00Z") };

const effectifInscrit = (apprenant: Partial<IEffectif["apprenant"]> = {}) =>
  ({
    _id: new ObjectId(),
    organisme_id: new ObjectId(),
    annee_scolaire: "2026-2027",
    source: "ERP",
    id_erp_apprenant: new ObjectId().toString(),
    apprenant: {
      nom: "dupont ",
      prenom: "jean",
      date_de_naissance: new Date("2000-01-14T23:00:00Z"),
      historique_statut: [],
      adresse: { region: "11" },
      ...apprenant,
    },
    _computed: {
      statut: {
        en_cours: STATUT_APPRENANT.INSCRIT,
        parcours: [{ date: new Date("2026-09-01T00:00:00Z"), valeur: STATUT_APPRENANT.INSCRIT }],
      },
    },
  }) as unknown as IEffectif;

const masques = async () =>
  (
    await franceTravailEffectifsDb()
      .find({ soft_deleted: true }, { projection: { _id: 1 } })
      .toArray()
  ).map(({ _id }) => _id.toString());

describe("dédoublonnage des dossiers France Travail sur l'identité", () => {
  it("pose l'identité normalisée et masque le dossier plus ancien de la même personne", async () => {
    const ancien = effectifInscrit();
    const recent = effectifInscrit({ nom: "DUPONT", prenom: "Jean", date_de_naissance: identite.date_de_naissance });
    const autrePersonne = effectifInscrit({ nom: "MARTIN" });

    await createFranceTravailEffectifSnapshot(ancien);
    await createFranceTravailEffectifSnapshot(autrePersonne);
    await createFranceTravailEffectifSnapshot(recent);

    expect((await franceTravailEffectifsDb().findOne({ _id: recent._id }))?.identifiant_normalise).toStrictEqual(
      identite
    );
    expect(await franceTravailEffectifsDb().findOne({ _id: recent._id })).not.toHaveProperty("person_id");
    expect(await masques()).toStrictEqual([ancien._id.toString()]);
  });

  it("garde le dossier le plus récemment transmis pour chaque personne", async () => {
    const ancien = { ...effectifInscrit(), transmitted_at: new Date("2026-09-02T00:00:00Z") };
    const recent = { ...effectifInscrit(), transmitted_at: new Date("2026-10-02T00:00:00Z") };
    const seul = { ...effectifInscrit({ nom: "MARTIN" }), transmitted_at: new Date("2026-09-02T00:00:00Z") };
    for (const effectif of [recent, ancien, seul]) {
      await createFranceTravailEffectifSnapshot(effectif, false);
    }
    expect(await masques()).toStrictEqual([]);

    await dedupeInscritSansContrat();

    expect(await masques()).toStrictEqual([ancien._id.toString()]);
  });
});
