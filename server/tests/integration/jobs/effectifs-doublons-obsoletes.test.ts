import { subDays } from "date-fns";
import { ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IFranceTravailEffectif } from "shared/models/data/franceTravailEffectif.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import {
  effectifsDb,
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { rapportDoublonsObsoletes } from "@/jobs/effectifs/doublons-obsoletes";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

const NOW = new Date("2026-09-30T12:00:00Z");
const ANNEE = getAnneeScolaireFromDate(NOW);
const SOURCE = new ObjectId().toString();

const identite = { nom: "DURAND", prenom: "Léa", date_de_naissance: new Date("2007-03-04T00:00:00Z") };

async function creerOrganisme(nom: string): Promise<IOrganisme> {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme(), nom };
  await organismesDb().insertOne(organisme);
  return organisme;
}

async function insererEffectif({
  organisme,
  idErp,
  transmisIlYa,
  apprenant = identite,
  source = SOURCE,
}: {
  organisme: IOrganisme;
  idErp: string;
  transmisIlYa: number;
  apprenant?: Partial<IEffectif["apprenant"]>;
  source?: string;
}) {
  const effectif = {
    _id: new ObjectId(),
    ...(await createSampleEffectif({
      organisme,
      annee_scolaire: ANNEE,
      id_erp_apprenant: idErp,
      source_organisme_id: source,
      apprenant,
    })),
    transmitted_at: subDays(NOW, transmisIlYa),
  };
  await effectifsDb().insertOne(testDoc<IEffectif>(effectif));
  return effectif;
}

describe("rapportDoublonsObsoletes", () => {
  useMongo();

  let ancien: IOrganisme;
  let recent: IOrganisme;

  beforeEach(async () => {
    for (const collection of ["missionLocaleEffectif", "franceTravailEffectif", "voeuxAffelnet"]) {
      await getDatabase().command({ collMod: collection, validationLevel: "off" });
    }
    ancien = await creerOrganisme("CMAR NOUVELLE AQUITAINE");
    recent = await creerOrganisme("CMA FORMATION NIORT");
  });

  it("classe supprimable une fiche de même identité non transmise depuis plus de 30 jours", async () => {
    const fiche = await insererEffectif({ organisme: ancien, idErp: "A1", transmisIlYa: 45 });
    const jumeau = await insererEffectif({ organisme: recent, idErp: "A1", transmisIlYa: 0 });

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.groupes).toBe(1);
    expect(rapport.par_categorie).toEqual({ supprimable: 1, oscillation: 0, identite_differente: 0 });
    expect(rapport.fiches_detail).toHaveLength(1);
    expect(rapport.fiches_detail[0]).toMatchObject({
      effectif_id: fiche._id,
      organisme_id: ancien._id,
      jumeau_id: jumeau._id,
      jumeau_organisme_id: recent._id,
      ecart_jours: 45,
      categorie: "supprimable",
      liens: { ml: false, jumeau_ml: false, france_travail: false, voeux: false },
    });
    expect(rapport.par_organisme).toEqual([
      expect.objectContaining({ organisme_id: ancien._id.toString(), nom: "CMAR NOUVELLE AQUITAINE", supprimable: 1 }),
    ]);
    expect(rapport.par_source).toEqual([expect.objectContaining({ source_organisme_id: SOURCE, supprimable: 1 })]);
  });

  it("classe oscillation une fiche transmise il y a moins de 30 jours", async () => {
    await insererEffectif({ organisme: ancien, idErp: "B1", transmisIlYa: 5 });
    await insererEffectif({ organisme: recent, idErp: "B1", transmisIlYa: 0 });

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.par_categorie).toEqual({ supprimable: 0, oscillation: 1, identite_differente: 0 });
    expect(rapport.fiches_detail[0]).toMatchObject({
      organisme_id: ancien._id,
      ecart_jours: 5,
      categorie: "oscillation",
    });
  });

  it("respecte un seuil personnalisé", async () => {
    await insererEffectif({ organisme: ancien, idErp: "B2", transmisIlYa: 10 });
    await insererEffectif({ organisme: recent, idErp: "B2", transmisIlYa: 0 });

    const rapport = await rapportDoublonsObsoletes({ date: NOW, seuilJours: 7 });

    expect(rapport.seuil_jours).toBe(7);
    expect(rapport.par_categorie.supprimable).toBe(1);
  });

  it("ne classe jamais supprimable une fiche dont l'identité diffère, quel que soit l'écart", async () => {
    await insererEffectif({ organisme: ancien, idErp: "C1", transmisIlYa: 90 });
    await insererEffectif({
      organisme: recent,
      idErp: "C1",
      transmisIlYa: 0,
      apprenant: { ...identite, nom: "MARTIN" },
    });

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.par_categorie).toEqual({ supprimable: 0, oscillation: 0, identite_differente: 1 });
  });

  it("tolère les accents, la casse et les espaces dans l'identité", async () => {
    await insererEffectif({
      organisme: ancien,
      idErp: "C2",
      transmisIlYa: 40,
      apprenant: { ...identite, nom: " durand ", prenom: "LEA" },
    });
    await insererEffectif({ organisme: recent, idErp: "C2", transmisIlYa: 0 });

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.par_categorie.supprimable).toBe(1);
  });

  it("signale les dossiers ML, France Travail et voeux liés à la fiche et au jumeau", async () => {
    const fiche = await insererEffectif({ organisme: ancien, idErp: "D1", transmisIlYa: 60 });
    const jumeau = await insererEffectif({ organisme: recent, idErp: "D1", transmisIlYa: 0 });
    await missionLocaleEffectifsDb().insertMany([
      testDoc<IMissionLocaleEffectif>({ effectif_id: fiche._id, mission_locale_id: new ObjectId() }),
      testDoc<IMissionLocaleEffectif>({ effectif_id: jumeau._id, mission_locale_id: new ObjectId() }),
    ]);
    await franceTravailEffectifsDb().insertOne(testDoc<IFranceTravailEffectif>({ effectif_id: fiche._id }));
    await voeuxAffelnetDb().insertOne(testDoc<IVoeuAffelnet>({ effectif_id: fiche._id }));

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.liens).toEqual({ ml: 1, france_travail: 1, voeux: 1 });
    expect(rapport.fiches_detail[0].liens).toEqual({ ml: true, jumeau_ml: true, france_travail: true, voeux: true });
    expect(rapport.par_organisme[0].avec_lien).toBe(1);
  });

  it("ignore les dossiers ML soft-deleted", async () => {
    const fiche = await insererEffectif({ organisme: ancien, idErp: "D2", transmisIlYa: 60 });
    await insererEffectif({ organisme: recent, idErp: "D2", transmisIlYa: 0 });
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>({ effectif_id: fiche._id, mission_locale_id: new ObjectId(), soft_deleted: true })
    );

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.liens.ml).toBe(0);
  });

  it("ne rapproche pas deux transmetteurs différents ni deux années différentes", async () => {
    await insererEffectif({ organisme: ancien, idErp: "E1", transmisIlYa: 60 });
    await insererEffectif({ organisme: recent, idErp: "E1", transmisIlYa: 0, source: new ObjectId().toString() });
    const autreAnnee = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: recent,
        annee_scolaire: "2019-2020",
        id_erp_apprenant: "E1",
        source_organisme_id: SOURCE,
      })),
      transmitted_at: NOW,
    };
    await effectifsDb().insertOne(testDoc<IEffectif>(autreAnnee));

    const rapport = await rapportDoublonsObsoletes({ date: NOW });

    expect(rapport.groupes).toBe(0);
    expect(rapport.fiches).toBe(0);
  });

  it("n'écrit rien", async () => {
    const fiche = await insererEffectif({ organisme: ancien, idErp: "F1", transmisIlYa: 60 });
    await insererEffectif({ organisme: recent, idErp: "F1", transmisIlYa: 0 });

    await rapportDoublonsObsoletes({ date: NOW });

    expect(await effectifsDb().countDocuments()).toBe(2);
    expect(await effectifsDb().findOne({ _id: fiche._id })).not.toBeNull();
  });
});
