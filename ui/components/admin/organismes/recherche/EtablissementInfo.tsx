import { Link, Text, Wrap } from "@chakra-ui/react";
import { useMemo } from "react";
import { OrganismeSupportInfoJson } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import NewTable from "@/modules/indicateurs/NewTable";
import { ExternalLinkLine } from "@/theme/components/icons";

import { CardInfo } from "./CarInfo";
import { Label } from "./Label";

function getCatalogueFormationEtablissementInfo(siret, catalogueFormation) {
  if (catalogueFormation.etablissement_formateur_siret === siret) {
    return {
      enseigne: catalogueFormation.etablissement_formateur_enseigne,
      adresse: [
        catalogueFormation.etablissement_formateur_adresse,
        catalogueFormation.etablissement_formateur_code_postal,
        catalogueFormation.etablissement_formateur_localite,
      ].join(" "),
      raison_sociale: catalogueFormation.etablissement_formateur_entreprise_raison_sociale,
      date_creation: catalogueFormation.etablissement_formateur_date_creation,
    };
  }
  if (catalogueFormation.etablissement_gestionnaire_siret === siret) {
    return {
      enseigne: catalogueFormation.etablissement_gestionnaire_enseigne,
      adresse: [
        catalogueFormation.etablissement_gestionnaire_adresse,
        catalogueFormation.etablissement_gestionnaire_code_postal,
        catalogueFormation.etablissement_gestionnaire_localite,
      ].join(" "),
      raison_sociale: catalogueFormation.etablissement_gestionnaire_entreprise_raison_sociale,
      date_creation: catalogueFormation.etablissement_gestionnaire_date_creation,
    };
  }
  return null;
}

function getCatalogueEtablissementInfo(siret: string, formations: OffreFormation[]) {
  const result = formations.reduce(
    (acc, formation) => {
      const info = getCatalogueFormationEtablissementInfo(siret, formation);

      if (info?.enseigne) acc.enseigne.add(info?.enseigne);
      if (info?.adresse) acc.adresse.add(info?.adresse);
      if (info?.raison_sociale) acc.raison_sociale.add(info?.raison_sociale);
      if (info?.date_creation) acc.date_creation.add(formatDateDayMonthYear(new Date(info.date_creation)));

      return acc;
    },
    {
      enseigne: new Set(),
      adresse: new Set(),
      raison_sociale: new Set(),
      date_creation: new Set(),
    }
  );

  return {
    enseigne: Array.from(result.enseigne),
    adresse: Array.from(result.adresse),
    raison_sociale: Array.from(result.raison_sociale),
    date_creation: Array.from(result.date_creation),
  };
}

function getApiEntrepriseEtat(etablissement) {
  if (!etablissement?.etat_administratif) return null;
  return etablissement.etat_administratif === "A" ? "actif" : "fermé";
}

function getTdbEtat(organisme) {
  if (organisme?.ferme == null) return null;
  return organisme.ferme ? "fermé" : "actif";
}

function getEtablissementInfoData(row: OrganismeSupportInfoJson) {
  const catalogueInfo = getCatalogueEtablissementInfo(row.siret, row.formations as OffreFormation[]);

  return [
    {
      name: "enseigne",
      apiEntreprise: row.apiEntreprise?.enseigne ?? null,
      tdb: row.tdb?.enseigne ?? null,
      referentiel: row.referentiel?.enseigne ?? null,
      catalogue: catalogueInfo.enseigne,
    },
    {
      name: "raison_sociale",
      apiEntreprise: row.apiEntreprise?.unite_legale?.personne_morale_attributs?.raison_sociale ?? null,
      tdb: row.tdb?.raison_sociale ?? null,
      referentiel: row.referentiel?.raison_sociale ?? null,
      catalogue: catalogueInfo.raison_sociale,
    },
    {
      name: "etat",
      apiEntreprise: getApiEntrepriseEtat(row.apiEntreprise),
      tdb: getTdbEtat(row.tdb),
      referentiel: row.referentiel?.etat_administratif ?? null,
      catalogue: ["n/a"],
    },
    {
      name: "adresse",
      apiEntreprise: row.apiEntreprise
        ? [
            row.apiEntreprise.adresse.complement_adresse,
            row.apiEntreprise.adresse.numero_voie,
            row.apiEntreprise.adresse.type_voie,
            row.apiEntreprise.adresse.libelle_voie,
            row.apiEntreprise.adresse.code_postal,
            row.apiEntreprise.adresse.libelle_commune,
          ].join(" ")
        : null,
      tdb: row.tdb?.adresse?.complete ?? null,
      referentiel: row.referentiel?.adresse?.label ?? null,
      catalogue: catalogueInfo.adresse,
    },
    {
      name: "date_creation",
      apiEntreprise: row.apiEntreprise?.date_creation
        ? // On prend le jour précédent
          formatDateDayMonthYear(new Date(row.apiEntreprise.date_creation * 1_000 - 1_000))
        : null,
      tdb: "n/a",
      referentiel: "n/a",
      catalogue: catalogueInfo.date_creation,
    },
    {
      name: "date_fermeture",
      apiEntreprise: row.apiEntreprise?.date_fermeture
        ? formatDateDayMonthYear(new Date(row.apiEntreprise.date_fermeture * 1_000))
        : "n/a",
      tdb: "n/a",
      referentiel: "n/a",
      catalogue: ["n/a"],
    },
  ];
}

function getInfoItemLevel(infoItem, type) {
  const values = Array.from(
    new Set(
      [infoItem.apiEntreprise, infoItem.tdb, infoItem.referentiel, ...infoItem.catalogue].filter(
        (v) => v !== null && v !== "n/a"
      )
    )
  );

  const valueType = type !== "catalogue" ? infoItem[type] : infoItem.catalogue[0] ?? null;

  if (valueType === "n/a") return "info";

  if (infoItem.name === "etat" && valueType !== "actif") return "error";

  if (values.length === 0) return "warning";

  if (valueType === null) return "error";
  if (values.length === 1) return "info";
  return "error";
}

type EtablissementInfoProps = {
  supportInfo: OrganismeSupportInfoJson;
};

export function EtablissementInfo({ supportInfo }: EtablissementInfoProps) {
  const info = useMemo(() => getEtablissementInfoData(supportInfo), [supportInfo]);

  return (
    <CardInfo title="Établissement">
      (
      <NewTable
        data={info}
        showPagination={false}
        paginationState={{ pageIndex: 0, pageSize: 1000 }}
        columns={[
          {
            header: "Information",
            cell: ({ row }) => (
              <Text fontSize="zeta" fontWeight="bold">
                {row.original.name}
              </Text>
            ),
          },
          {
            header: () => (
              <Link isExternal href={`/organismes/${supportInfo.tdb?._id}`}>
                Tableau de Bord
                <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
              </Link>
            ),
            accessorKey: "tdb",
            cell: ({ row }) => {
              const level = getInfoItemLevel(row.original, "tdb");
              return <Label level={level} value={row.original.tdb ?? "inconnu"} />;
            },
          },
          {
            header: () => (
              <Link isExternal href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${supportInfo.siret}`}>
                Api Entreprise
                <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
              </Link>
            ),
            accessorKey: "apiEntreprise",
            cell: ({ row }) => {
              const level = getInfoItemLevel(row.original, "apiEntreprise");
              return <Label level={level} value={row.original.apiEntreprise ?? "inconnu"} />;
            },
          },
          {
            header: () => (
              <Link
                isExternal
                href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${supportInfo.siret}`}
              >
                Référentiel
                <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
              </Link>
            ),
            accessorKey: "referentiel",
            cell: ({ row }) => {
              const level = getInfoItemLevel(row.original, "referentiel");
              return <Label level={level} value={row.original.referentiel ?? "inconnu"} />;
            },
          },
          {
            header: () => (
              <Link
                isExternal
                href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${supportInfo.siret}%22`}
              >
                Catalogue
                <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
              </Link>
            ),
            accessorKey: "catalogue",
            cell: ({ row }) => {
              const level = getInfoItemLevel(row.original, "catalogue");
              const values = row.original.catalogue;

              return (
                <Wrap>
                  {values.length === 0 && <Label level={level} value="inconnu" />}
                  {values.map((v: string) => (
                    <Label level={level} key={v} value={v} />
                  ))}
                </Wrap>
              );
            },
          },
        ]}
      />
      )
    </CardInfo>
  );
}
