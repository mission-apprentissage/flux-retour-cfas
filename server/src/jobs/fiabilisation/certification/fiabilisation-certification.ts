import { captureException } from "@sentry/node";
import type { ICertification } from "api-alternance-sdk";
import { zCfd, zRncp } from "api-alternance-sdk/internal";
import Boom from "boom";
import type { IEffectif } from "shared/models";

import { getNiveauFormationLibelle } from "@/common/actions/formations.actions";
import { getCfdInfo, getRncpInfo } from "@/common/apis/apiAlternance/apiAlternance";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";

function isWithRange(date: Date | null, range: { debut: Date | null; fin: Date | null }): boolean {
  // If date is null, we assume it's valid
  if (date === null) {
    return true;
  }

  if (range.debut !== null && range.debut.getTime() > date.getTime()) {
    return false;
  }

  if (range.fin !== null && range.fin.getTime() < date.getTime()) {
    return false;
  }

  return true;
}

function isSessionValidForRncp(
  session: { start: Date | null; end: Date | null },
  rncp: { activation: Date | null; fin_enregistrement: Date | null } | null
): boolean {
  if (!rncp) {
    return true;
  }

  // RNCP is valid is the start date is withing activation perido
  return isWithRange(session.start, { debut: rncp.activation, fin: rncp.fin_enregistrement });
}

function isSessionValidForCfd(
  session: { start: Date | null; end: Date | null },
  cfd: { ouverture: Date | null; fermeture: Date | null } | null
): boolean {
  if (!cfd) {
    return true;
  }

  const openingRange = { debut: cfd.ouverture, fin: cfd.fermeture };
  return isWithRange(session.start, openingRange) && isWithRange(session.end, openingRange);
}

function filterCertificationContinuiteValidity(
  continuite: ICertification["continuite"],
  session: { start: Date | null; end: Date | null }
): ICertification["continuite"] {
  return {
    cfd: continuite.cfd?.filter((c) => isSessionValidForCfd(session, c)) ?? null,
    rncp: continuite.rncp?.filter((c) => isSessionValidForRncp(session, c)) ?? null,
  };
}

export function getEffectifSession(effectif: Pick<IEffectif, "formation">): { start: Date | null; end: Date | null } {
  if (!effectif.formation) {
    return { start: null, end: null };
  }

  const { date_entree, periode, date_fin } = effectif.formation;

  if (date_entree) {
    return { start: date_entree, end: date_fin ?? null };
  }

  if (periode && periode.length > 0) {
    const [start, end] = periode;

    return { start: new Date(`${start}-01-01`), end: effectif.formation.date_fin ?? new Date(`${end}-12-31`) };
  }

  return { start: null, end: date_fin ?? null };
}

async function resolveEffectiveCFD(effectif: Pick<IEffectif, "formation">): Promise<string | null> {
  const rawCfd = effectif.formation?.cfd ?? null;

  if (rawCfd === null) {
    return null;
  }

  const cfd = rawCfd.padStart(8, "0");

  if (!zCfd.safeParse(cfd).success) {
    logger.warn(Boom.internal("fiabilisation-certification: invalid cfd", { cfd, formation: effectif.formation }));
    return rawCfd;
  }

  const certifications = await apiAlternanceClient.certification.index({ identifiant: { cfd } });

  if (certifications.length === 0) {
    logger.warn(
      Boom.internal("fiabilisation-certification: cfd non found on API alternance", {
        cfd,
        formation: effectif.formation,
      })
    );
    return rawCfd;
  }

  const session = getEffectifSession(effectif);

  // We check only the CFD, so we consider only CFD validity
  if (isSessionValidForCfd(session, certifications[0].periode_validite.cfd)) {
    return cfd;
  }

  const continuite = filterCertificationContinuiteValidity(certifications[0].continuite, session);

  if (!continuite.cfd || continuite.cfd.length === 0) {
    logger.warn(
      Boom.internal("fiabilisation-certification: no replacement found for cfd", {
        cfd,
        formation: effectif.formation,
      })
    );
    return cfd;
  }

  if (continuite.cfd.length > 1) {
    logger.warn(
      Boom.internal("fiabilisation-certification: multiple replacement found for cfd", {
        cfd,
        continuite,
        formation: effectif.formation,
      })
    );
    return cfd;
  }

  return continuite.cfd[0].code;
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
    logger.warn(
      Boom.internal("fiabilisation-certification: rncp non found on API alternance", {
        rncp,
        formation: effectif.formation,
      })
    );
    return rncp;
  }

  const session = getEffectifSession(effectif);

  // We check only the RNCP, so we consider only RNCP validity
  if (isSessionValidForRncp(session, certifications[0].periode_validite.rncp)) {
    return rncp;
  }

  const continuite = filterCertificationContinuiteValidity(certifications[0].continuite, session);

  if (!continuite.rncp || continuite.rncp.length === 0) {
    logger.warn(
      Boom.internal("fiabilisation-certification: no replacement found for rncp", {
        rncp,
        formation: effectif.formation,
        continuite,
      })
    );
    return rncp;
  }

  if (continuite.rncp.length > 1) {
    logger.warn(
      Boom.internal("fiabilisation-certification: multiple replacement found for rncp", {
        rncp,
        continuite,
        formation: effectif.formation,
      })
    );
    return rncp;
  }

  return continuite.rncp[0].code;
}

export function getSessionCertification<C extends Pick<ICertification, "periode_validite" | "identifiant">>(
  session: { start: Date | null; end: Date | null },
  certifications: C[]
): C | null {
  const candidats = certifications.filter(
    (certification) =>
      isWithRange(session.start, certification.periode_validite) &&
      isSessionValidForRncp(session, certification.periode_validite.rncp) &&
      isSessionValidForCfd(session, certification.periode_validite.cfd)
  );

  if (candidats.length > 1) {
    logger.warn(
      Boom.internal("fiabilisation-certification: multiple certification found for session", {
        session,
        candidats,
        certifications: certifications.map((c) => c.identifiant),
      })
    );
  }

  return candidats[0] ?? null;
}

export async function getEffectifCertification(effectif: Pick<IEffectif, "formation">): Promise<ICertification | null> {
  try {
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
    const session = getEffectifSession(effectif);

    return getSessionCertification(session, certifications);
  } catch (err) {
    captureException(err);
    logger.error("fiabilisation-certification: error while getting effectif certification", { err, effectif });
    return null;
  }
}

export async function fiabilisationEffectifFormation<T extends Pick<IEffectif, "formation">>(
  effectif: T,
  certification: ICertification | null
): Promise<T["formation"]> {
  if (!certification) {
    const [cfdInfo, rncpInfo] = await Promise.all([
      effectif.formation?.cfd ? getCfdInfo(effectif.formation?.cfd) : null,
      effectif.formation?.rncp ? getRncpInfo(effectif.formation?.rncp) : null,
    ]);

    const niveau = cfdInfo?.niveau ?? rncpInfo?.niveau;
    const intituleLong = cfdInfo?.intitule_long ?? rncpInfo?.intitule;
    const niveauLibelle = niveau ? getNiveauFormationLibelle(niveau) : null;
    return {
      ...effectif.formation,
      ...(intituleLong && { libelle_long: intituleLong }),
      ...(niveau && { niveau }),
      ...(niveauLibelle && { niveau_libelle: niveauLibelle }),
    };
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
    niveau_libelle: getNiveauFormationLibelle(niveau),
  };
}
