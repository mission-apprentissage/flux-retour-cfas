"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { OrganismeSupportInfoJson } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./etablissement-comparison.module.scss";
import { SupportBadge, SupportLevel, SupportValue } from "./SupportBadge";

const INFO_LABELS: Record<string, string> = {
  enseigne: "Enseigne",
  raison_sociale: "Raison sociale",
  etat: "État",
  adresse: "Adresse",
  date_creation: "Date de création",
  date_fermeture: "Date de fermeture",
};

interface ComparisonRow {
  name: string;
  apiEntreprise: string | null;
  tdb: string | null;
  referentiel: string | null;
  catalogue: string[];
}

function getEtablissementFromFormation(siret: string, formation: OffreFormation) {
  if (formation.formateur?.siret === siret) return formation.formateur;
  if (formation.gestionnaire?.siret === siret) return formation.gestionnaire;
  return null;
}

function getCatalogueInfo(siret: string, formations: OffreFormation[]) {
  const enseigne = new Set<string>();
  const adresse = new Set<string>();
  const raisonSociale = new Set<string>();
  const dateCreation = new Set<string>();

  for (const formation of formations) {
    const etablissement = getEtablissementFromFormation(siret, formation);
    if (!etablissement) continue;

    if (etablissement.enseigne) enseigne.add(etablissement.enseigne);
    if (etablissement.raison_sociale) raisonSociale.add(etablissement.raison_sociale);
    if (etablissement.date_creation) dateCreation.add(formatDate(etablissement.date_creation));

    const adresseComplete = [
      etablissement.adresse?.adresse,
      etablissement.adresse?.code_postal,
      etablissement.adresse?.localite,
    ]
      .filter(Boolean)
      .join(" ");
    if (adresseComplete) adresse.add(adresseComplete);
  }

  return {
    enseigne: [...enseigne],
    raison_sociale: [...raisonSociale],
    adresse: [...adresse],
    date_creation: [...dateCreation],
  };
}

function getApiEntrepriseEtat(etablissement: OrganismeSupportInfoJson["apiEntreprise"]) {
  if (!etablissement?.etat_administratif) return null;
  return etablissement.etat_administratif === "A" ? "actif" : "fermé";
}

function buildComparison(supportInfo: OrganismeSupportInfoJson): ComparisonRow[] {
  const catalogue = getCatalogueInfo(supportInfo.siret, supportInfo.formations as OffreFormation[]);
  const apiEntreprise = supportInfo.apiEntreprise;

  return [
    {
      name: "enseigne",
      apiEntreprise: apiEntreprise?.enseigne ?? null,
      tdb: supportInfo.tdb?.enseigne ?? null,
      referentiel: supportInfo.referentiel?.enseigne ?? null,
      catalogue: catalogue.enseigne,
    },
    {
      name: "raison_sociale",
      apiEntreprise: apiEntreprise?.unite_legale?.personne_morale_attributs?.raison_sociale ?? null,
      tdb: supportInfo.tdb?.raison_sociale ?? null,
      referentiel: supportInfo.referentiel?.raison_sociale ?? null,
      catalogue: catalogue.raison_sociale,
    },
    {
      name: "etat",
      apiEntreprise: getApiEntrepriseEtat(apiEntreprise),
      tdb: supportInfo.tdb?.ferme == null ? null : supportInfo.tdb.ferme ? "fermé" : "actif",
      referentiel: supportInfo.referentiel?.etat_administratif ?? null,
      catalogue: ["n/a"],
    },
    {
      name: "adresse",
      apiEntreprise: apiEntreprise
        ? [
            apiEntreprise.adresse.complement_adresse,
            apiEntreprise.adresse.numero_voie,
            apiEntreprise.adresse.type_voie,
            apiEntreprise.adresse.libelle_voie,
            apiEntreprise.adresse.code_postal,
            apiEntreprise.adresse.libelle_commune,
          ]
            .filter(Boolean)
            .join(" ")
        : null,
      tdb: supportInfo.tdb?.adresse?.complete ?? null,
      referentiel: supportInfo.referentiel?.adresse?.label ?? null,
      catalogue: catalogue.adresse,
    },
    {
      name: "date_creation",
      apiEntreprise: apiEntreprise?.date_creation
        ? formatDate(new Date(apiEntreprise.date_creation * 1_000 - 1_000).toISOString())
        : null,
      tdb: "n/a",
      referentiel: "n/a",
      catalogue: catalogue.date_creation,
    },
    {
      name: "date_fermeture",
      apiEntreprise: apiEntreprise?.date_fermeture
        ? formatDate(new Date(apiEntreprise.date_fermeture * 1_000).toISOString())
        : "n/a",
      tdb: "n/a",
      referentiel: "n/a",
      catalogue: ["n/a"],
    },
  ];
}

function getLevel(row: ComparisonRow, source: "apiEntreprise" | "tdb" | "referentiel" | "catalogue"): SupportLevel {
  const values = [...new Set([row.apiEntreprise, row.tdb, row.referentiel, ...row.catalogue])].filter(
    (value) => value !== null && value !== "n/a"
  );
  const value = source === "catalogue" ? (row.catalogue[0] ?? null) : row[source];

  if (value === "n/a") return "info";
  if (row.name === "etat" && value !== "actif") return "error";
  if (values.length === 0) return "warning";
  if (value === null) return "error";
  return values.length === 1 ? "info" : "error";
}

function ComparisonCell({ row, source }: { row: ComparisonRow; source: "apiEntreprise" | "tdb" | "referentiel" }) {
  const level = getLevel(row, source);
  const value = row[source];

  if (value === "n/a") return <span className={styles.notApplicable}>Sans objet</span>;
  if (row.name === "etat") return <SupportBadge level={level} value={value ?? "Inconnu"} />;

  return (
    <SupportValue
      value={value}
      level={level}
      divergenceHint={level === "error" && value !== null ? "valeur divergente entre les sources" : undefined}
    />
  );
}

export function EtablissementComparison({ supportInfo }: { supportInfo: OrganismeSupportInfoJson }) {
  const rows = buildComparison(supportInfo);

  return (
    <Table
      caption="Comparaison de l’établissement entre les quatre sources"
      bordered
      headers={[
        "Information",
        <DsfrLink key="tdb" href={`/organismes/${supportInfo.tdb?._id}`} arrow="none">
          Tableau de bord
        </DsfrLink>,
        <DsfrLink
          key="api"
          href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${supportInfo.siret}`}
          arrow="none"
          external
        >
          Api Entreprise
        </DsfrLink>,
        <DsfrLink
          key="referentiel"
          href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${supportInfo.siret}`}
          arrow="none"
          external
        >
          Référentiel
        </DsfrLink>,
        <DsfrLink
          key="catalogue"
          href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${supportInfo.siret}%22`}
          arrow="none"
          external
        >
          Catalogue
        </DsfrLink>,
      ]}
      data={rows.map((row) => [
        <span key="label" className={styles.rowLabel}>
          {INFO_LABELS[row.name] ?? row.name}
        </span>,
        <ComparisonCell key="tdb" row={row} source="tdb" />,
        <ComparisonCell key="api" row={row} source="apiEntreprise" />,
        <ComparisonCell key="referentiel" row={row} source="referentiel" />,
        row.catalogue.length === 0 ? (
          <SupportValue key="catalogue" value={null} />
        ) : row.catalogue[0] === "n/a" ? (
          <span key="catalogue" className={styles.notApplicable}>
            Sans objet
          </span>
        ) : (
          <ul key="catalogue" className={styles.catalogueValues}>
            {row.catalogue.map((value) => (
              <li key={value}>
                <SupportValue
                  value={value}
                  level={getLevel(row, "catalogue")}
                  divergenceHint={
                    getLevel(row, "catalogue") === "error" ? "valeur divergente entre les sources" : undefined
                  }
                />
              </li>
            ))}
          </ul>
        ),
      ])}
    />
  );
}
