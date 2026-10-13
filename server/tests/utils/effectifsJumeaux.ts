import { subDays } from "date-fns";
import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneeScolaireFromDate } from "shared/utils";

import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { testDoc } from "@tests/utils/testUtils";

export const NOW = new Date("2026-09-30T12:00:00Z");
export const DATE_STATUT = new Date("2026-01-01T00:00:00Z");
export const ANNEE = getAnneeScolaireFromDate(NOW);
export const SOURCE = new ObjectId().toString();
export const ML_ID = new ObjectId();

export const identite = { nom: "DURAND", prenom: "Léa", date_de_naissance: new Date("2007-03-04T00:00:00Z") };

export type Statut = (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];

export const avecStatut = (effectif: IEffectif, statut: Statut): IEffectif => ({
  ...effectif,
  _computed: {
    ...effectif._computed,
    statut: { en_cours: statut, parcours: [{ valeur: statut, date: DATE_STATUT }] },
  },
});

export async function creerOrganisme(nom: string): Promise<IOrganisme> {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme(), nom };
  await organismesDb().insertOne(organisme);
  return organisme;
}

export async function creerMissionLocale() {
  await organisationsDb().insertOne(
    testDoc<IOrganisation>({ _id: ML_ID, type: "MISSION_LOCALE", ml_id: 42, nom: "ML Niort", created_at: NOW })
  );
}

export async function insererEffectif({
  organisme,
  idErp = "A1",
  transmisIlYa = 0,
  apprenant = identite,
  source = SOURCE,
  statut,
}: {
  organisme: IOrganisme;
  idErp?: string;
  transmisIlYa?: number;
  apprenant?: Partial<IEffectif["apprenant"]>;
  source?: string;
  statut?: Statut;
}): Promise<IEffectif> {
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
  } as IEffectif;
  const insere = statut ? avecStatut(effectif, statut) : effectif;
  await effectifsDb().insertOne(insere);
  return insere;
}

export async function insererDossierMl(effectif: IEffectif, extra: Partial<IMissionLocaleEffectif> = {}) {
  const dossier = testDoc<IMissionLocaleEffectif>({
    mission_locale_id: ML_ID,
    effectif_id: effectif._id,
    effectif_snapshot: effectif,
    effectif_snapshot_date: NOW,
    date_rupture: null,
    created_at: NOW,
    current_status: { value: effectif._computed?.statut?.en_cours ?? null, date: DATE_STATUT },
    ...extra,
  });
  await missionLocaleEffectifsDb().insertOne(dossier);
  return dossier;
}
