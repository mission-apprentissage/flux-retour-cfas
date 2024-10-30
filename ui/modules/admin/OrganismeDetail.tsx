import { HStack, StackProps, Tag } from "@chakra-ui/react";
import React from "react";

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
