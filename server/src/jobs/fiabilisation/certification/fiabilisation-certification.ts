import { captureException } from "@sentry/node";
import type { ICertification } from "api-alternance-sdk";
import { zCfd, zRncp } from "api-alternance-sdk/internal";
import Boom from "boom";
import type { IEffectif } from "shared/models";

import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";

function isEffectifStartFormationWithinPeriod(
  effectif: Pick<IEffectif, "formation">,
  from: Date | null,
  to: Date | null
): boolean {
  if (!effectif.formation) {
    // We don't have any information about the formation
    // Let's assume it's valid
    return true;
  }

  const { date_entree, periode } = effectif.formation;

  const fromTime = from?.getTime() ?? -Infinity;
  const toTime = to?.getTime() ?? Infinity;

  if (date_entree) {
    return date_entree.getTime() >= fromTime && date_entree.getTime() <= toTime;
  }

  if (periode && periode[0]) {
    if (from && periode[0] < from.getFullYear()) {
      return false;
    }

    if (to && periode[0] > to.getFullYear()) {
      return false;
    }

    return true;
  }

  // We don't have enough information about the formation
  // Let's assume it's valid
  return true;
}

async function resolveEffectiveCFD(effectif: Pick<IEffectif, "formation">): Promise<string | null> {
  const rawCfd = effectif.formation?.cfd ?? null;

  if (rawCfd === null) {
    return null;
  }

  const cfd = rawCfd.padStart(8, "0");

  if (!zCfd.safeParse(cfd).success) {
    captureException(Boom.internal("fiabilisation-certification: invalid cfd", { cfd }));
    return rawCfd;
  }

  const certifications = await apiAlternanceClient.certification.index({ identifiant: { cfd } });

  if (certifications.length === 0) {
    captureException(Boom.internal("fiabilisation-certification: cfd non found on API alternance", { cfd }));
    return rawCfd;
  }

  // We searched by CFD, so cfd part is always defined
  if (
    isEffectifStartFormationWithinPeriod(
      effectif,
      certifications[0].periode_validite.cfd!.ouverture,
      certifications[0].periode_validite.cfd!.fermeture
    )
  ) {
    return cfd;
  }

  const candidates =
    certifications[0].continuite.cfd?.filter((c) => {
      return isEffectifStartFormationWithinPeriod(effectif, c.ouverture, c.fermeture);
    }) ?? [];

  if (candidates.length > 1) {
    captureException(
      Boom.internal("fiabilisation-certification: multiple replacement found for cfd", { cfd, candidates })
    );
    return cfd;
  }

  if (candidates.length === 0) {
    captureException(Boom.internal("fiabilisation-certification: no replacement found for cfd", { cfd }));
    return cfd;
  }

  return candidates[0].code;
}

async function resolveEffectiveRNCP(effectif: Pick<IEffectif, "formation">): Promise<string | null> {
  let rncp = effectif.formation?.rncp ?? null;

  if (rncp === null) {
    return null;
  }

  if (!rncp.startsWith("RNCP")) {
    rncp = `RNCP${rncp}`;
  }

  if (!zRncp.safeParse(rncp).success) {
    return rncp;
  }

  const certifications = await apiAlternanceClient.certification.index({ identifiant: { rncp } });

  if (certifications.length === 0) {
    captureException(Boom.internal("fiabilisation-certification: rncp non found on API alternance", { rncp }));
    return rncp;
  }

  // We searched by RNCP, so rncp part is always defined
  if (
    isEffectifStartFormationWithinPeriod(
      effectif,
      certifications[0].periode_validite.rncp!.activation,
      certifications[0].periode_validite.rncp!.fin_enregistrement
    )
  ) {
    return rncp;
  }

  const candidates =
    certifications[0].continuite.rncp?.filter((c) => {
      return isEffectifStartFormationWithinPeriod(effectif, c.activation, c.fin_enregistrement);
    }) ?? [];

  if (candidates.length > 1) {
    captureException(
      Boom.internal("fiabilisation-certification: multiple replacement found for rncp", { rncp, candidates })
    );
    return rncp;
  }

  if (candidates.length === 0) {
    captureException(Boom.internal("fiabilisation-certification: no replacement found for rncp", { rncp }));
    return rncp;
  }

  return candidates[0].code;
}

export function getEffectiveEffectifCertification<C extends Pick<ICertification, "periode_validite">>(
  effectif: Pick<IEffectif, "formation">,
  certifications: C[]
): C | null {
  if (!effectif.formation || certifications.length === 0) {
    return null;
  }

  const candidats = certifications.filter((certification) =>
    isEffectifStartFormationWithinPeriod(
      effectif,
      certification.periode_validite.debut,
      certification.periode_validite.fin
    )
  );

  return (
    candidats.toSorted((a, b) => {
      if (a.periode_validite.debut === null) return 1;
      if (b.periode_validite.debut === null) return -1;
      return b.periode_validite.debut.getTime() - a.periode_validite.debut.getTime();
    })[0] ?? null
  );
}

export async function getEffectifCertification(effectif: Pick<IEffectif, "formation">): Promise<ICertification | null> {
  const { formation } = effectif;

  if (!formation) {
    return null;
  }

  const [cfd, rncp] = await Promise.all([resolveEffectiveCFD(effectif), resolveEffectiveRNCP(effectif)]);

  const filter: Parameters<typeof apiAlternanceClient.certification.index>[0]["identifiant"] = {};

  if (!cfd && !rncp) {
    return null;
  }

  if (cfd) {
    if (!zCfd.safeParse(cfd).success) {
      return null;
    }

    filter.cfd = cfd;
  }

  if (rncp) {
    if (!zRncp.safeParse(rncp).success) {
      return null;
    }

    filter.rncp = rncp;
  }

  const certifications = await apiAlternanceClient.certification.index({ identifiant: filter });

  return getEffectiveEffectifCertification(effectif, certifications);
}

export function fiabilisationEffectifFormation<T extends Pick<IEffectif, "formation">>(
  effectif: T,
  certification: ICertification | null
): T["formation"] {
  if (!certification) {
    return effectif.formation;
  }

  const niveau = certification.intitule.niveau.rncp?.europeen ?? certification.intitule.niveau.cfd?.europeen ?? null;

  return {
    ...effectif.formation,
    cfd: certification.identifiant.cfd,
    rncp: certification.identifiant.rncp,
    libelle_long:
      certification.intitule.cfd?.long ?? certification.intitule.rncp ?? effectif.formation?.libelle_long ?? null,
    libelle_court:
      certification.intitule.cfd?.court ?? certification.intitule.rncp ?? effectif.formation?.libelle_court ?? null,
    niveau,
    niveau_libelle: getNiveauFormationFromLibelle(niveau),
  };
}
