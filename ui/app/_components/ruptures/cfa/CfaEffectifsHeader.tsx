"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { DECA_TOOLTIP_TEXT } from "@/common/types/cfaRuptures";
import { COMPTE_SETTINGS_HREF } from "@/common/utils/compteSettings";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { useErp } from "@/hooks/useErp";

import styles from "./CfaEffectifsHeader.module.css";
import { getCfaSourceDescriptor } from "./cfaEffectifsSource";

interface CfaEffectifsHeaderProps {
  isAllowedDeca: boolean;
}

function DecaMention() {
  return (
    <>
      <strong className={styles.deca}>DECA</strong>
      <span className={styles.decaTooltip}>
        <Tooltip kind="hover" title={DECA_TOOLTIP_TEXT} />
      </span>
    </>
  );
}

export function CfaEffectifsHeader({ isAllowedDeca }: CfaEffectifsHeaderProps) {
  const { organisme, isLoading } = useOrganisationOrganisme();
  const { erpsById } = useErp();

  // Tant que l'organisme n'est pas chargé, aucun état de source n'est affiché : le rendre
  // ferait clignoter « aucune source » sur un CFA qui a bien un ERP.
  const { state, showsDeca, linkLabel } = getCfaSourceDescriptor(organisme, isAllowedDeca);
  const sourceResolved = !isLoading && !!organisme;

  const erpNames = (organisme?.erps ?? [])
    .map((erpId) => erpsById[erpId]?.name)
    .filter(Boolean)
    .join(", ");
  const configurationDate = organisme?.mode_de_transmission_configuration_date;

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Effectifs de l&apos;établissement</h1>
      {organisme && (
        <p className={styles.organismeName}>{organisme.enseigne || organisme.raison_sociale || organisme.nom}</p>
      )}

      <p className={styles.sources}>
        Retrouvez ici la liste de vos effectifs dans votre établissement.{" "}
        {sourceResolved && state === "erp" && (
          <>
            Sources de ces données : <strong>Votre ERP{erpNames ? ` ${erpNames}` : ""}</strong>
            {configurationDate && <>, connecté le {formatDateNumericDayMonthYear(configurationDate)}</>}
            {showsDeca ? (
              <>
                {" "}
                et la base <DecaMention /> en source complémentaire.
              </>
            ) : (
              "."
            )}
          </>
        )}
        {sourceResolved && state === "fichier" && (
          <>
            Sources de ces données : <strong>vos dépôts de fichiers</strong>
            {showsDeca ? (
              <>
                {" "}
                et la base <DecaMention /> en source complémentaire.
              </>
            ) : (
              "."
            )}
          </>
        )}
        {sourceResolved && state === "aucune" && (
          <>
            {showsDeca && (
              <>
                Sources de ces données : la base <DecaMention />.{" "}
              </>
            )}
            Vous pouvez {showsDeca ? "aussi " : ""}apporter votre propre source de données en connectant directement
            votre ERP ou en ajoutant vos effectifs manuellement par un dépôt de fichier.
          </>
        )}
      </p>

      {sourceResolved && (
        <DsfrLink href={COMPTE_SETTINGS_HREF} className={styles.sourceLink}>
          {linkLabel}
        </DsfrLink>
      )}
    </div>
  );
}
