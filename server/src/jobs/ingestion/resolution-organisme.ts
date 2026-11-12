import { ObjectId } from "mongodb";
import { IAttributionOrganisme } from "shared/models/data/effectifsQueue.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { findOrganismeFormateursIds, findOrganismeResponsablesIds } from "@/common/actions/helpers/permissions";
import { findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { organismesDb } from "@/common/model/collections";

import { fiabilisationUaiSiret } from "../fiabilisation/uai-siret/updateFiabilisation";

export interface OrganismeSearchStatsInfos {
  id?: string;
  uai?: string;
  uai_corrige?: string;
  siret?: string;
  siret_corrige?: string;
  fiabilisation?: "FIABLE" | "NON_FIABLE" | "INCONNU";
  found?: boolean;
  attribution?: IAttributionOrganisme["mode"];
  uai_retenue?: string | null;
  siret_retenu?: string | null;
}

const relationsIds = (organisme: IOrganisme) => [
  ...findOrganismeFormateursIds(organisme, true),
  ...findOrganismeResponsablesIds(organisme),
];

async function surclasserParTransmetteur(
  siret: string,
  sourceOrganismeId: string | null | undefined,
  projection: Record<string, unknown>
): Promise<{ organisme: IOrganisme; mode: "transmetteur" | "famille" } | null> {
  if (!sourceOrganismeId || !ObjectId.isValid(sourceOrganismeId)) {
    return null;
  }
  const transmetteur = await organismesDb().findOne(
    { _id: new ObjectId(sourceOrganismeId) },
    { projection: { organismesFormateurs: 1, organismesResponsables: 1 } }
  );
  if (!transmetteur) {
    return null;
  }

  const projectionCandidats =
    Object.keys(projection).length === 0
      ? {}
      : { ...projection, uai: 1, siret: 1, organismesFormateurs: 1, organismesResponsables: 1 };
  const candidats = await organismesDb()
    .find({ siret, ferme: { $ne: true } }, { projection: projectionCandidats, sort: { _id: 1 } })
    .toArray();

  const transmetteurLui = candidats.find((candidat) => candidat._id.equals(transmetteur._id));
  if (transmetteurLui) {
    return { organisme: transmetteurLui, mode: "transmetteur" };
  }
  const relationsTransmetteur = relationsIds(transmetteur);
  const famille = candidats.find(
    (candidat) =>
      relationsTransmetteur.some((id) => id.equals(candidat._id)) ||
      relationsIds(candidat).some((id) => id.equals(transmetteur._id))
  );
  return famille ? { organisme: famille, mode: "famille" } : null;
}

export async function findOrganismeWithStats(
  uai_etablissement: string,
  siret_etablissement?: string,
  projection: Record<string, unknown> = {},
  sourceOrganismeId?: string | null
): Promise<{ organisme: IOrganisme | null; stats: OrganismeSearchStatsInfos }> {
  const stats: OrganismeSearchStatsInfos = {};

  // 1. On essaie de corriger l'UAI et le SIRET avec la collection fiabilisationUaiSiret
  const fiabilisationResult = await fiabilisationUaiSiret({
    uai: uai_etablissement,
    siret: siret_etablissement,
  });

  // 2. On cherche l'organisme avec le couple uai/siret
  let organisme = await findOrganismeByUaiAndSiret(fiabilisationResult.uai, fiabilisationResult.siret, projection);
  let retenu = { uai: fiabilisationResult.uai, siret: fiabilisationResult.siret };
  let attribution = fiabilisationResult.mode;
  const siretDuResponsable =
    fiabilisationResult.api_response?.resultat?.correspondances.siret?.son_responsable === true;

  if (attribution === "lieu" && siret_etablissement && !siretDuResponsable) {
    const surclassement = await surclasserParTransmetteur(siret_etablissement, sourceOrganismeId, projection);
    if (surclassement) {
      organisme = surclassement.organisme;
      retenu = { uai: surclassement.organisme.uai, siret: surclassement.organisme.siret };
      attribution = surclassement.mode;
    }
  }

  // 3. Des indicateurs pour apporter des informations sur le traitement
  stats.uai = uai_etablissement;
  if (retenu.uai !== uai_etablissement) {
    stats.uai_corrige = retenu.uai ?? undefined;
  }
  stats.siret = siret_etablissement;
  if (retenu.siret !== siret_etablissement) {
    stats.siret_corrige = retenu.siret ?? undefined;
  }
  stats.fiabilisation = fiabilisationResult.statut;
  stats.attribution = attribution;
  stats.uai_retenue = retenu.uai ?? null;
  stats.siret_retenu = retenu.siret ?? null;
  stats.found = !!organisme;
  if (organisme) {
    stats.id = organisme._id.toString();
  }
  return { organisme, stats };
}
