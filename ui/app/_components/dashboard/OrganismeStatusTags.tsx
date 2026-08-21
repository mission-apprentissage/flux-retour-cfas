"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { FAQ_REFERENCER_ETABLISSEMENT, IndicateursEffectifs, STATUT_FIABILISATION_ORGANISME } from "shared";

const FIABILISATION_TOOLTIP =
  "Organisme considéré comme non-fiable si au moins l’une des conditions suivantes est remplie : l’UAI est inconnu ou non-validé dans le Référentiel ; la nature (déduite des relations entre organismes) est inconnue — se rapprocher du Carif-Oref régional pour la déclarer ; l’état administratif du SIRET de l’établissement, tel qu’il est enregistré auprès de l’INSEE, est fermé.";

const DECA_TOOLTIP =
  "Effectifs affichés provenant de la source DECA (DEpôts des Contrats d’Alternance). La date correspond à la dernière récupération brute de cette base. Pour une donnée plus fraîche, l’organisme doit transmettre lui-même ses effectifs.";

const DUPLICATS_TOOLTIP =
  "Duplicats d’effectifs détectés : des effectifs sont en doublons et doivent être supprimés dans l’onglet « Mes effectifs ». Sans cette action, les doublons sont comptabilisés dans les effectifs globaux de l’établissement.";

export function InfoFiabilisationTag({ fiabilisationStatut }: { fiabilisationStatut?: string }) {
  const isFiable = fiabilisationStatut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  return (
    <span>
      <Badge severity={isFiable ? "success" : "warning"} small>
        {isFiable ? "Organisme fiable" : "Organisme non fiable"}
      </Badge>{" "}
      <Tooltip kind="hover" title={`${FIABILISATION_TOOLTIP} En savoir plus : ${FAQ_REFERENCER_ETABLISSEMENT}`} />
    </span>
  );
}

export function InfoTransmissionDecaTag({
  date,
  indicateursEffectifs,
}: {
  date?: Date;
  indicateursEffectifs?: IndicateursEffectifs;
}) {
  if (!indicateursEffectifs?.apprenants) return null;

  return (
    <span>
      <Badge severity="info" small>
        Données DECA{date ? ` — dernière MAJ : ${date.toLocaleDateString("fr")}` : ""}
      </Badge>{" "}
      <Tooltip kind="hover" title={DECA_TOOLTIP} />
    </span>
  );
}

export function AlertDuplicatsTag() {
  return (
    <span>
      <Badge severity="warning" small>
        Duplicats détectés
      </Badge>{" "}
      <Tooltip kind="hover" title={DUPLICATS_TOOLTIP} />
    </span>
  );
}
