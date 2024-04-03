import { Text, HStack, StackProps, Tag } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";

import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import InfoDetail from "@/modules/admin/InfoDetail";

const TagLink = ({ label }) => (
  <Tag bg="#E3E3FD" borderRadius="20px" px={3} py={1} maxWidth="min-content" display="inline" color="#000091" mx="6px">
    {label}
  </Tag>
);
export const ExternalLinks = ({
  search,
  siret,
  isAdmin,
  ...props
}: { search?: string; siret?: string; isAdmin?: boolean } & StackProps) => (
  <HStack gap={2} {...props}>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${search}%22`}
    >
      <TagLink label="Catalogue"></TagLink>
    </a>
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${search}`}
    >
      <TagLink label="Référentiel"></TagLink>
    </a>
    {siret && isAdmin && (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${siret}`}
      >
        <TagLink label="Réf API"></TagLink>
      </a>
    )}
    {siret && (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`}
      >
        <TagLink label="Annuaire des entreprises"></TagLink>
      </a>
    )}
  </HStack>
);

const OrganismeDetail = ({ data }) => {
  return (
    <InfoDetail
      data={data}
      rows={{
        nom: {
          header: () => "Nom de l'organisme",
        },
        enseigne: {
          header: () => "Enseigne",
        },
        nature: {
          header: () => "Nature",
        },
        adresse: {
          header: () => "Localisation",
          cell: ({ value }) => (
            <>
              <pre>{value?.complete}</pre>
            </>
          ),
        },
        siret: {
          header: () => "SIRET",
          cell: ({ value }) => (
            <HStack gap={4}>
              <Text bgColor="galtDark" px={2}>
                {value || "SIRET INCONNU"}
              </Text>
              {value && <ExternalLinks search={value} siret={value} isAdmin={true} />}
            </HStack>
          ),
        },
        uai: {
          header: () => "Numéro UAI",
          cell: ({ value }) => (
            <HStack gap={4}>
              <Text bgColor="galtDark" px={2}>
                {value || "UAI INCONNU"}
              </Text>
              {value && (
                <HStack gap={2}>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://catalogue-apprentissage.intercariforef.org/recherche/etablissements?SEARCH=%22${value}%22`}
                  >
                    [CAT]
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${value}`}
                  >
                    [REF]
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://referentiel.apprentissage.onisep.fr/api/v1/organismes/${value}`}
                  >
                    [REF_API]
                  </a>
                </HStack>
              )}
            </HStack>
          ),
        },
        ferme: {
          header: () => "État",
          cell: ({ value }) => {
            if (value) {
              return (
                <Text color="redmarianne" fontWeight="bold">
                  Fermé
                </Text>
              );
            }
            return (
              <Text bgColor="galtDark" px={2}>
                Actif
              </Text>
            );
          },
        },
        reseaux: {
          header: () => "Réseau(x)",
          cell: ({ value }) => (
            <Text whiteSpace="nowrap" bgColor="galtDark" px={2}>
              {value.length ? value.join(", ") : ""}
            </Text>
          ),
        },
        erps: {
          header: () => "ERP(s)",
          cell: ({ value }) => (
            <Text whiteSpace="nowrap" bgColor="galtDark" px={2}>
              {value.length ? value.join(", ") : ""}
            </Text>
          ),
        },
        mode_de_transmission: {
          header: () => "Mode de transmission",
        },
        fiabilisation_statut: {
          header: () => "Fiabilisation",
          cell: ({ value }) => (
            <Text
              bgColor="galtDark"
              px={2}
              {...(value === "INCONNU" ? { color: "redmarianne", fontWeight: "bold" } : {})}
            >
              {FIABILISATION_LABEL[value] || value}
            </Text>
          ),
        },
        est_dans_le_referentiel: {
          header: () => "Est dans le Référentiel?",
          cell: ({ value }) =>
            value === "present" || value === "present_uai_multiples_dans_tdb" ? (
              <Text color="green">{value}</Text>
            ) : (
              <Text color="tomato">{value}</Text>
            ),
        },
        last_transmission_date: {
          header: () => "Dernière transmission au tdb",
          cell: ({ value }) =>
            value ? (
              <Text color="green">
                Le {formatDateDayMonthYear(value)} - il y a {formatDistanceToNow(new Date(value))}
              </Text>
            ) : (
              <Text color="tomato">Ne transmet pas</Text>
            ),
        },
        effectifs_count: {
          header: () => "Nb Effectifs",
        },
      }}
    />
  );
};

export default OrganismeDetail;
