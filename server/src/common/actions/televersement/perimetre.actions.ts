import { zSiret, zUai } from "api-alternance-sdk/internal";
import { ObjectId } from "mongodb";
import { IOrganisme } from "shared/models/data/organismes.model";
import { extensions } from "shared/models/parts/zodPrimitives";

import { findOrganismeFormateursIds } from "@/common/actions/helpers/permissions";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { findOrganismeWithStats } from "@/jobs/ingestion/resolution-organisme";

export const MESSAGE_API_ALTERNANCE_INDISPONIBLE =
  "La vérification des établissements est momentanément impossible. Réessayez dans quelques minutes. Rien n'a été importé.";

type LigneTeleversement = {
  etablissement_formateur_uai?: unknown;
  etablissement_formateur_siret?: unknown;
};

export type IssuePerimetre = {
  path: [number, "etablissement_formateur_uai"];
  message: string;
  code: "custom";
};

type Perimetre = {
  ids: Set<string>;
  siretsFormateurs: Set<string>;
  siren: string | null;
  idsMemeSiren: ObjectId[];
};

type Jugement = "dans_perimetre" | "hors_perimetre" | "indisponible";

async function construirePerimetre(source: IOrganisme): Promise<Perimetre> {
  const formateursIds = findOrganismeFormateursIds(source, true);
  const formateurs = await organismesDb()
    .find({ _id: { $in: formateursIds } }, { projection: { siret: 1 } })
    .toArray();
  const siren = source.siret && /^\d{14}$/.test(source.siret) ? source.siret.slice(0, 9) : null;
  const memeSiren = siren
    ? await organismesDb()
        .find({ siret: { $regex: `^${siren}` } }, { projection: { _id: 1 } })
        .toArray()
    : [];

  return {
    ids: new Set([source._id, ...formateursIds].map((id) => id.toString())),
    siretsFormateurs: new Set(formateurs.map(({ siret }) => siret).filter((siret): siret is string => !!siret)),
    siren,
    idsMemeSiren: memeSiren.map(({ _id }) => _id),
  };
}

async function estDansPerimetre(organisme: IOrganisme, perimetre: Perimetre): Promise<boolean> {
  if (perimetre.ids.has(organisme._id.toString())) {
    return true;
  }
  if (!organisme.siret) {
    return false;
  }
  if (perimetre.siretsFormateurs.has(organisme.siret)) {
    return true;
  }
  if (perimetre.siren && organisme.siret.startsWith(perimetre.siren)) {
    return true;
  }
  if (perimetre.idsMemeSiren.length === 0) {
    return false;
  }
  const contratDeca = await effectifsDECADb().findOne(
    { etablissement_formation_siret: organisme.siret, organisme_id: { $in: perimetre.idsMemeSiren } },
    { projection: { _id: 1 } }
  );
  return !!contratDeca;
}

async function jugerEtablissement(
  uai: string,
  siret: string | undefined,
  source: IOrganisme,
  perimetre: Perimetre
): Promise<Jugement> {
  const { organisme, stats } = await findOrganismeWithStats(uai, siret, {}, source._id.toString());
  if (stats.attribution === "indisponible") {
    return "indisponible";
  }
  if (!organisme) {
    return "dans_perimetre";
  }
  return (await estDansPerimetre(organisme, perimetre)) ? "dans_perimetre" : "hors_perimetre";
}

export async function verifierPerimetreTeleversement(
  sourceOrganismeId: ObjectId,
  lignes: LigneTeleversement[]
): Promise<{ indisponible: boolean; issues: IssuePerimetre[] }> {
  const source = await organismesDb().findOne({ _id: sourceOrganismeId });
  if (!source) {
    return { indisponible: false, issues: [] };
  }

  const perimetre = await construirePerimetre(source);
  const jugements = new Map<string, Promise<Jugement>>();
  const nomSource = source.enseigne || source.raison_sociale || source.nom || "cet organisme";

  const resultats = await Promise.all(
    lignes.map(async (ligne, index) => {
      const uai = extensions.uai().safeParse(ligne.etablissement_formateur_uai);
      if (!uai.success) {
        return null;
      }
      const siretLu = extensions.siret().safeParse(ligne.etablissement_formateur_siret);
      const siret = siretLu.success ? siretLu.data : undefined;
      if (!zUai.safeParse(uai.data).success || (siret && !zSiret.safeParse(siret).success)) {
        return null;
      }
      const cle = `${uai.data}|${siret ?? ""}`;
      if (!jugements.has(cle)) {
        jugements.set(cle, jugerEtablissement(uai.data, siret, source, perimetre));
      }
      return { index, uai: uai.data, jugement: await jugements.get(cle)! };
    })
  );

  const issues: IssuePerimetre[] = [];
  let indisponible = false;
  for (const resultat of resultats) {
    if (!resultat) {
      continue;
    }
    if (resultat.jugement === "indisponible") {
      indisponible = true;
    } else if (resultat.jugement === "hors_perimetre") {
      issues.push({
        path: [resultat.index, "etablissement_formateur_uai"],
        message: `L'établissement ${resultat.uai} n'est pas rattaché à ${nomSource}. Ses apprenants ne peuvent pas être importés ici.`,
        code: "custom",
      });
    }
  }

  return { indisponible, issues };
}
