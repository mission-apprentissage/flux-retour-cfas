import { Box, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { IMissionLocaleEffectif } from "shared";

import { _post } from "@/common/httpClient";

import ApprenantsSituationSelect from "./ApprenantsSituationSelect";

const apprenantsTableColumnsDefs = (
  updateSituationState: (effectifId: string, newSituation: Partial<IMissionLocaleEffectif>) => void
) => [
  {
    accessorKey: "apprenant.nom",
    header: () => "Nom",
    cell: ({ getValue }) => (
      <HStack>
        <Text>{getValue()}</Text>
      </HStack>
    ),
    size: 160,
  },
  {
    accessorKey: "apprenant.prenom",
    header: () => "Prénom",
    cell: ({ getValue }) => <Text>{getValue()}</Text>,
    size: 160,
  },
  {
    accessorKey: "formation",
    header: () => "Formation suivie",
    cell: ({ row }) => {
      return (
        <VStack alignItems="start" spacing={0} width="340px">
          <Text noOfLines={1}>{row.original?.formation?.libelle_long || "Libellé manquant"}</Text>
          <Text fontSize="xs" color="#777777" whiteSpace="nowrap">
            CFD&nbsp;: {row.original?.formation?.cfd} - RNCP&nbsp;: {row.original?.formation?.rncp}
          </Text>
        </VStack>
      );
    },
    size: 350,
  },
  {
    accessorKey: "apprenant.telephone",
    header: () => "Téléphone",
    cell: ({ row, getValue }) => {
      if (!row.original.apprenant.telephone) {
        return <Text color="orange.500">Non renseigné</Text>;
      }
      return <ShowErrorInCell item={row.original} fieldName="apprenant.telephone" value={getValue()} />;
    },
    size: 160,
  },
  {
    accessorKey: "apprenant.courriel",
    header: () => "Email",
    cell: ({ row }) => <EmailCell email={row.original.apprenant.courriel} />,
    size: 160,
  },
  {
    accessorKey: "apprenant.situation",
    header: () => "Situation",
    cell: ({ row }) => {
      const effectifId = row.original.id;
      const situation = row.original.situation_data?.situation || "";

      return (
        <ApprenantsSituationSelect
          effectifId={effectifId}
          situation={situation}
          updateSituationState={updateSituationState}
        />
      );
    },
    size: 200,
  },
];

const EmailCell = ({ email }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!email) {
    return <Text color="orange.500">Non renseigné</Text>;
  }

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard
      .writeText(email)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <Link
      variant="blueBg"
      href="#"
      onClick={handleCopyEmail}
      py={2.5}
      px={4}
      display="flex"
      alignItems="center"
      w="fit-content"
    >
      <Box as="i" className={isCopied ? "ri-checkbox-circle-fill ri-lg" : "ri-mail-line ri-lg"} mr={2} />
      {isCopied ? "Copié" : "Copier"}
    </Link>
  );
};

const ShowErrorInCell = ({ item, fieldName, value }) => {
  const { validation_errors } = item;
  const validation_error = validation_errors?.find((e) => e.fieldName === fieldName);
  if (validation_error) {
    return (
      <HStack color="flaterror">
        <Text fontSize="1rem" color="flaterror">
          {validation_error.inputValue || "Non renseigné"}
        </Text>
      </HStack>
    );
  }
  return value || "Non renseigné";
};

export default apprenantsTableColumnsDefs;
