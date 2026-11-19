import { ObjectId } from "mongodb";
import { zIdentifiantNormalise } from "shared/models/parts/identifiantNormalise";
import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import {
  poserIdentifiantFranceTravail,
  up,
} from "@/db/migrations/20261119120100-france-travail-identifiant-drop-person-v2";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const dateDeNaissance = new Date("2004-03-12T00:00:00Z");

const dossierFt = (extra: Record<string, unknown>) => ({
  _id: new ObjectId(),
  effectif_id: new ObjectId(),
  created_at: new Date("2026-02-01T00:00:00Z"),
  effectif_snapshot: { apprenant: { nom: " martin ", prenom: "léa", date_de_naissance: dateDeNaissance } },
  ...extra,
});

const ft = () => getDatabase().collection("franceTravailEffectif");
const personnes = () => getDatabase().collection("personV2");

const projection = { _id: 0, effectif_id: 0, created_at: 0, effectif_snapshot: 0 };

describe("migration france-travail-identifiant-drop-person-v2", () => {
  it("pose l'identité de la personne, se replie sur le snapshot, retire person_id et supprime personV2", async () => {
    const personne = {
      _id: new ObjectId(),
      identifiant: { nom: "DUPONT", prenom: "Jean", date_de_naissance: new Date("2003-01-09T00:00:00Z") },
    };
    const personneHeritee = {
      _id: new ObjectId(),
      identifiant: { nom: " durand", prenom: "léa ", date_de_naissance: new Date("2004-06-25T22:00:00Z") },
    };
    await personnes().insertMany([personne, personneHeritee]);
    const avecPersonneHeritee = dossierFt({ person_id: personneHeritee._id });
    const avecPersonne = dossierFt({ person_id: personne._id });
    const personneAbsente = dossierFt({ person_id: new ObjectId() });
    const sansPersonne = dossierFt({ person_id: null });
    const sansIdentite = dossierFt({ person_id: null, effectif_snapshot: { apprenant: { nom: "X" } } });
    const dejaMigre = dossierFt({ identifiant_normalise: personne.identifiant });
    await ft().insertMany([avecPersonne, avecPersonneHeritee, personneAbsente, sansPersonne, sansIdentite, dejaMigre], {
      bypassDocumentValidation: true,
    });

    await poserIdentifiantFranceTravail(getDatabase(), 2);
    await up(getDatabase());

    const identiteSnapshot = { nom: "MARTIN", prenom: "Léa", date_de_naissance: dateDeNaissance };
    expect(await ft().findOne({ _id: avecPersonne._id }, { projection })).toStrictEqual({
      identifiant_normalise: personne.identifiant,
    });
    expect(await ft().findOne({ _id: avecPersonneHeritee._id }, { projection })).toStrictEqual({
      identifiant_normalise: { nom: "DURAND", prenom: "Léa", date_de_naissance: new Date("2004-06-26T00:00:00Z") },
    });
    for (const dossier of await ft()
      .find({ identifiant_normalise: { $exists: true } })
      .toArray()) {
      expect(() => zIdentifiantNormalise.strict().parse(dossier.identifiant_normalise)).not.toThrow();
      expect(dossier).not.toHaveProperty("person_id");
    }
    expect(await ft().findOne({ _id: personneAbsente._id }, { projection })).toStrictEqual({
      identifiant_normalise: identiteSnapshot,
    });
    expect(await ft().findOne({ _id: sansPersonne._id }, { projection })).toStrictEqual({
      identifiant_normalise: identiteSnapshot,
    });
    expect(await ft().findOne({ _id: sansIdentite._id }, { projection })).toStrictEqual({});
    expect(await ft().findOne({ _id: dejaMigre._id }, { projection })).toStrictEqual({
      identifiant_normalise: personne.identifiant,
    });
    expect(await getDatabase().listCollections({ name: "personV2" }).toArray()).toHaveLength(0);
  });

  it("passe sans erreur quand personV2 n'existe pas", async () => {
    const dossier = dossierFt({ person_id: new ObjectId() });
    await ft().insertOne(dossier, { bypassDocumentValidation: true });

    await up(getDatabase());

    expect(await ft().findOne({ _id: dossier._id }, { projection: { person_id: 1 } })).toStrictEqual({
      _id: dossier._id,
    });
  });
});
