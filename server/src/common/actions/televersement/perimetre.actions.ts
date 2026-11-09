import { zSiret, zUai } from "api-alternance-sdk/internal";
import { ObjectId } from "mongodb";
import { ERREURS_TELEVERSEMENT } from "shared/constants";
import { IOrganisme } from "shared/models/data/organismes.model";
import { extensions } from "shared/models/parts/zodPrimitives";

import { findOrganismeFormateursIds } from "@/common/actions/helpers/permissions";
import { findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { findOrganismeWithStats } from "@/jobs/ingestion/resolution-organisme";

type LigneTeleversement = {
  etablissement_formateur_uai?: unknown;
  etablissement_formateur_siret?: unknown;
  etablissement_responsable_uai?: unknown;
  etablissement_responsable_siret?: unknown;
};

type ChampEtablissement = "etablissement_formateur_uai" | "etablissement_responsable_uai";

export type IssueEtablissement = {
  path: [number, ChampEtablissement];
  message: string;
  code: "custom";
  motif: "hors_perimetre" | "etablissement_inconnu";
};

type Perimetre = {
  ids: Set<string>;
  siretsFormateurs: Set<string>;
  siren: string | null;
  idsMemeSiren: ObjectId[];
};

type Resolution = { statut: "trouve"; organisme: IOrganisme } | { statut: "inconnu" } | { statut: "indisponible" };

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

async function resoudreEtablissement(uai: string, siret: string | undefined, source: IOrganisme): Promise<Resolution> {
  if (!zUai.safeParse(uai).success || (siret && !zSiret.safeParse(siret).success)) {
    const organisme = await findOrganismeByUaiAndSiret(uai, siret);
    return organisme ? { statut: "trouve", organisme } : { statut: "inconnu" };
  }
  const { organisme, stats } = await findOrganismeWithStats(uai, siret, {}, source._id.toString());
  if (stats.attribution === "indisponible") {
    return { statut: "indisponible" };
  }
  return organisme ? { statut: "trouve", organisme } : { statut: "inconnu" };
}

const lireCouple = (uaiBrut: unknown, siretBrut: unknown) => {
  const uai = extensions.uai().safeParse(uaiBrut);
  if (!uai.success) {
    return null;
  }
  const siret = extensions.siret().safeParse(siretBrut);
  return { uai: uai.data, siret: siret.success ? siret.data : undefined };
};

export async function verifierEtablissementsTeleversement(
  sourceOrganismeId: ObjectId,
  lignes: LigneTeleversement[]
): Promise<{ indisponible: boolean; issues: IssueEtablissement[]; organismeIdParLigne: (string | null)[] }> {
  const source = await organismesDb().findOne({ _id: sourceOrganismeId });
  if (!source) {
    return { indisponible: false, issues: [], organismeIdParLigne: lignes.map(() => null) };
  }

  const perimetre = await construirePerimetre(source);
  const resolutions = new Map<string, Promise<Resolution>>();
  const perimetres = new Map<string, Promise<boolean>>();
  const nomSource = source.enseigne || source.raison_sociale || source.nom || "cet organisme";
  const resoudre = (uai: string, siret: string | undefined) => {
    const cle = `${uai}|${siret ?? ""}`;
    if (!resolutions.has(cle)) {
      resolutions.set(cle, resoudreEtablissement(uai, siret, source));
    }
    return resolutions.get(cle)!;
  };
  const dansPerimetre = (organisme: IOrganisme) => {
    const cle = organisme._id.toString();
    if (!perimetres.has(cle)) {
      perimetres.set(cle, estDansPerimetre(organisme, perimetre));
    }
    return perimetres.get(cle)!;
  };

  const issues: IssueEtablissement[] = [];
  let indisponible = false;
  const organismeIdParLigne = await Promise.all(
    lignes.map(async (ligne, index) => {
      const inconnu = (champ: ChampEtablissement, couple: { uai: string; siret?: string }) =>
        issues.push({
          path: [index, champ],
          message: ERREURS_TELEVERSEMENT.etablissement_inconnu({ uai: couple.uai, siret: couple.siret ?? "absent" }),
          code: "custom",
          motif: "etablissement_inconnu",
        });

      const responsable = lireCouple(ligne.etablissement_responsable_uai, ligne.etablissement_responsable_siret);
      if (responsable) {
        const resolution = await resoudre(responsable.uai, responsable.siret);
        if (resolution.statut === "indisponible") {
          indisponible = true;
        } else if (resolution.statut === "inconnu") {
          inconnu("etablissement_responsable_uai", responsable);
        }
      }

      const formateur = lireCouple(ligne.etablissement_formateur_uai, ligne.etablissement_formateur_siret);
      if (!formateur) {
        return null;
      }
      const resolution = await resoudre(formateur.uai, formateur.siret);
      if (resolution.statut === "indisponible") {
        indisponible = true;
        return null;
      }
      if (resolution.statut === "inconnu") {
        inconnu("etablissement_formateur_uai", formateur);
        return null;
      }
      if (!(await dansPerimetre(resolution.organisme))) {
        issues.push({
          path: [index, "etablissement_formateur_uai"],
          message: ERREURS_TELEVERSEMENT.hors_perimetre({ uai: formateur.uai, organisme: nomSource }),
          code: "custom",
          motif: "hors_perimetre",
        });
      }
      return resolution.organisme._id.toString();
    })
  );

  issues.sort((a, b) => a.path[0] - b.path[0]);
  return { indisponible, issues, organismeIdParLigne };
}
