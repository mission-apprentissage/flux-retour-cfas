"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { DuplicateEffectifDetail, getStatut } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { getNestedValue } from "@/common/utils/misc";

import styles from "./doublons.module.scss";

interface GroupItem {
  label: string;
  key: string;
  render?: (duplicate: DuplicateEffectifDetail) => React.ReactNode;
  isDate?: boolean;
}

const personalDetails: GroupItem[] = [
  { label: "Prénom", key: "apprenant.prenom" },
  { label: "Nom", key: "apprenant.nom" },
  { label: "Numéro INE", key: "apprenant.ine" },
  { label: "Date de naissance", key: "apprenant.date_de_naissance", isDate: true },
  { label: "Courriel", key: "apprenant.courriel" },
  {
    label: "Téléphone",
    key: "apprenant.telephone",
    render: (duplicate: DuplicateEffectifDetail) => formatPhoneNumber(duplicate.apprenant?.telephone) || "-",
  },
  { label: "Identifiant ERP", key: "id_erp_apprenant" },
  { label: "Année scolaire", key: "_id.annee_scolaire" },
];

const addressDetails: GroupItem[] = [
  { label: "Code Insee", key: "apprenant.adresse.code_insee" },
  { label: "Code postal", key: "apprenant.adresse.code_postal" },
  { label: "Commune", key: "apprenant.adresse.commune" },
  { label: "Département", key: "apprenant.adresse.departement" },
  { label: "Académie", key: "apprenant.adresse.academie" },
  { label: "Région", key: "apprenant.adresse.region" },
];

const formationDetails: GroupItem[] = [
  { label: "Libellé de la formation", key: "formation.libelle_long" },
  { label: "Code formation diplôme", key: "formation.cfd" },
  { label: "Code RNCP", key: "formation.rncp" },
  {
    label: "Période de formation",
    key: "formation.periode",
    render: (duplicate: DuplicateEffectifDetail) => {
      if (duplicate.formation?.periode && duplicate.formation.periode.length > 0) {
        const startPeriod = duplicate.formation.periode[0] || "Date de début inconnue";
        const endPeriod = duplicate.formation.periode[1] || "Date de fin inconnue";
        return `${startPeriod} - ${endPeriod}`;
      }
      return "";
    },
  },
  { label: "Année de la formation", key: "formation.annee" },
];

const hasDifferences = (duplicates: DuplicateEffectifDetail[], attributeKey: string): boolean => {
  const values = duplicates.map((duplicate) =>
    attributeKey.includes(".") ? getNestedValue(duplicate, attributeKey) : duplicate[attributeKey]
  );
  const serializedValues = values.map((value) => (Array.isArray(value) ? JSON.stringify(value.sort()) : value));
  return new Set(serializedValues).size > 1;
};

function GroupHeaderRow({ title, icon, count }: { title: string; icon: string; count: number }) {
  return (
    <tr className={styles.groupHeaderRow}>
      <th scope="row">
        <i className={icon} aria-hidden="true" />
        {title}
      </th>
      {Array.from({ length: count }).map((_, index) => (
        <td key={`${title}-header-${index}`} />
      ))}
    </tr>
  );
}

export function DoublonsDetailTable({
  group,
  onRequestDelete,
}: {
  group: any;
  onRequestDelete: (duplicate: DuplicateEffectifDetail) => void;
}) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const duplicates: DuplicateEffectifDetail[] = group.duplicates;

  const processedDuplicates = duplicates.map((duplicate) => ({
    ...duplicate,
    statut: {
      ...(duplicate as any).statut,
      parcours: (duplicate as any).statut?.parcours?.slice().reverse() || [],
    },
  }));
  const maxStatutParcoursLength = Math.max(...processedDuplicates.map((dup) => dup.statut?.parcours?.length || 0));

  const sortedContratsDuplicates = duplicates.map((duplicate) => ({
    ...duplicate,
    contrats: [...(duplicate.contrats ?? [])].sort(
      (a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
    ),
  }));
  const maxContratsLength = Math.max(...sortedContratsDuplicates.map((dup) => dup.contrats.length));

  const renderGroup = (groupItems: GroupItem[], label: string, icon: string) => (
    <>
      <GroupHeaderRow title={label} icon={icon} count={duplicates.length} />
      {groupItems.map((attribute, rowIndex) => {
        const isDiff = hasDifferences(duplicates, attribute.key);
        return (
          <tr
            key={attribute.label}
            className={isDiff ? styles.diffRow : rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}
          >
            <td>{attribute.label}</td>
            {duplicates.map((duplicate, index) => {
              const value = attribute.render
                ? attribute.render(duplicate)
                : attribute.key.includes(".")
                  ? getNestedValue(duplicate, attribute.key)
                  : duplicate[attribute.key];
              const displayValue = attribute.isDate && value ? formatDateDayMonthYear(value) : value;
              return <td key={`${attribute.key}-${index}`}>{displayValue}</td>;
            })}
          </tr>
        );
      })}
    </>
  );

  return (
    <div className={styles.detailWrapper}>
      <table className={styles.detailTable}>
        <thead>
          <tr className={styles.duplicateHeaderRow}>
            <th scope="col">Informations</th>
            {duplicates.map((duplicate, index) => (
              <th scope="col" key={index}>
                <span className={styles.duplicateHeaderCell}>
                  <span>Duplicat {index + 1}</span>
                  {index === 0 && (
                    <Badge severity="success" noIcon small as="span">
                      Dernier effectif transmis
                    </Badge>
                  )}
                  <Button
                    priority="secondary"
                    size="small"
                    iconId="fr-icon-delete-line"
                    onClick={() => {
                      trackPlausibleEvent("suppression_doublons_effectifs");
                      onRequestDelete(duplicate);
                    }}
                  >
                    Supprimer
                  </Button>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <GroupHeaderRow title="Historique du statut" icon="fr-icon-calendar-fill" count={duplicates.length} />
          {Array.from({ length: maxStatutParcoursLength }).map((_, rowIndex) => (
            <tr key={`statut-row-${rowIndex}`} className={rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td>{rowIndex === 0 ? "Statut actuel" : "Statut précédent"}</td>
              {processedDuplicates.map((duplicate, duplicateIndex) => {
                const statut = duplicate.statut?.parcours?.[rowIndex];
                if (!statut) {
                  return (
                    <td key={`duplicate-${duplicateIndex}-statut-${rowIndex}`} className={styles.mutedCell}>
                      <i>Aucun statut</i>
                    </td>
                  );
                }
                return (
                  <td
                    key={`duplicate-${duplicateIndex}-statut-${rowIndex}`}
                    className={rowIndex === 0 ? undefined : styles.mutedCell}
                  >
                    <b>{getStatut(statut.valeur)}</b>
                    <span className={styles.cellSub}>à la date du {formatDateDayMonthYear(statut.date)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
          {renderGroup(personalDetails, "Apprenant", "fr-icon-user-fill")}
          {renderGroup(addressDetails, "Adresse", "fr-icon-home-4-fill")}
          {renderGroup(formationDetails, "Formation", "ri-graduation-cap-fill")}
          <GroupHeaderRow title="Contrats" icon="fr-icon-draft-fill" count={duplicates.length} />
          {Array.from({ length: maxContratsLength }).map((_, rowIndex) => (
            <tr key={`contrat-row-${rowIndex}`} className={rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td>{rowIndex === 0 ? "Dernier contrat" : "Ancien contrat"}</td>
              {sortedContratsDuplicates.map((duplicate, duplicateIndex) => {
                const contrat = duplicate.contrats[rowIndex];
                if (!contrat) {
                  return (
                    <td key={`duplicate-${duplicateIndex}-contrat-${rowIndex}`} className={styles.mutedCell}>
                      <i>Aucun contrat</i>
                    </td>
                  );
                }
                return (
                  <td
                    key={`duplicate-${duplicateIndex}-contrat-${rowIndex}`}
                    className={rowIndex === 0 ? undefined : styles.mutedCell}
                  >
                    <span className={styles.cellSub}>
                      Début: <strong>{formatDateDayMonthYear(contrat.date_debut)}</strong>
                    </span>
                    <span className={styles.cellSub}>
                      Fin: {contrat.date_fin ? formatDateDayMonthYear(contrat.date_fin) : "NC"}
                    </span>
                    {contrat.date_rupture && (
                      <span className={styles.cellSub}>Rupture: {formatDateDayMonthYear(contrat.date_rupture)}</span>
                    )}
                    <span className={styles.cellSub}>Cause de rupture: {contrat.cause_rupture || "NC"}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
