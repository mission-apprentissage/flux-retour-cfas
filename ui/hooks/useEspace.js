import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";

import { _get } from "../common/httpClient";
import useAuth from "./useAuth";
import { organismeAtom, organismeNavigationAtom } from "./organismeAtoms";

function getMesOrganismesLabelFromOrganisationType(type) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Mon réseau";

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Sur mon territoire";

    case "DGEFP":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
    // FIXME undefined en attendant la répération de la session...
    //throw new Error(`Type '${type}' inconnu`);
  }
}

export function useEspace() {
  const router = useRouter();
  const { auth, organisationType } = useAuth();

  const match = router.asPath.match(/mon-espace\/(?<part>[0-9a-zA-Z-_]+)(\/(?<slug>[0-9a-zA-Z-_/]+))?/);
  const part = match?.groups?.part;
  const slug = match?.groups?.slug?.split("/") || [];

  const isMonOrganismePages = part === "mon-organisme";
  const isOrganismePages = part === "organisme";
  const isMesOrganismesPages = router.asPath.includes("/mon-espace/mes-organismes");
  const isMonOrganismePage = isMonOrganismePages && !slug.length;
  const isEffectifsPage = slug.includes("effectifs");
  const isTeleversementPage = isEffectifsPage && slug.includes("televersement");
  const isSIFAPage = slug.includes("enquete-SIFA");
  const isParametresPage = slug.includes("parametres");
  const organisme_id = isOrganismePages
    ? slug?.[slug.length - (isTeleversementPage ? 3 : isEffectifsPage || isSIFAPage || isParametresPage ? 2 : 1)]
    : null;

  const navigation = {
    user: {
      tableauDeBord: {
        pageTitle: "Mon tableau de bord",
        navTitle: "Mon tableau de bord",
        path: "/mon-espace/mon-organisme",
      },
      ...([
        "ORGANISME_FORMATION_FORMATEUR",
        "ORGANISME_FORMATION_RESPONSABLE",
        "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
      ].includes(organisationType)
        ? {
            effectifs: {
              pageTitle: "Mes effectifs",
              navTitle: "Mes effectifs",
              path: "/mon-espace/mon-organisme/effectifs",
            },
            televersement: {
              pageTitle: "Import de fichier(s)",
              navTitle: "Import de fichier(s)",
              path: "/mon-espace/mon-organisme/effectifs/televersement",
            },
            sifa2: {
              pageTitle: "Mon enquête SIFA",
              navTitle: "Mon enquête SIFA",
              path: "/mon-espace/mon-organisme/enquete-SIFA",
            },
          }
        : {}),
      mesOrganismes: {
        pageTitle: getMesOrganismesLabelFromOrganisationType(organisationType),
        navTitle: getMesOrganismesLabelFromOrganisationType(organisationType),
        path: "/mon-espace/mes-organismes",
      },
    },
    organisme: {
      tableauDeBord: {
        pageTitle: "Son tableau de bord",
        navTitle: "Son tableau de bord",
        path: `/mon-espace/organisme/${organisme_id}`,
      },
    },
  };

  return {
    organisme_id,
    organisationType,
    navigation: navigation || {},
    isMonOrganismePages,
    isOrganismePages,
    isMesOrganismesPages,
    isMonOrganismePage,
    isEffectifsPage,
    isTeleversementPage,
    isSIFAPage,
    isParametresPage,
  };
}
