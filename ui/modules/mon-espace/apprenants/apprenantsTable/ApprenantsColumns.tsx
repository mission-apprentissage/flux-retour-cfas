import { Box, HStack, Link, Select, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

const apprenantsTableColumnsDefs = [
  {
    accessorKey: "apprenant.nom",
    header: () => "Nom",
    cell: ({ row, getValue }) => <ShowErrorInCell item={row.original} fieldName="apprenant.nom" value={getValue()} />,
    size: 160,
  },
  {
    accessorKey: "apprenant.prenom",
    header: () => "Prénom",
    cell: ({ row, getValue }) => (
      <ShowErrorInCell item={row.original} fieldName="apprenant.prenom" value={getValue()} />
    ),
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
            CFD&nbsp;: {row.original?.formation?.cfd} - RNCP&nbsp;: {row.original?.formation?.cfd}
          </Text>
        </VStack>
      );
    },
    size: 350,
  },
  {
    accessorKey: "apprenant.telephone",
    header: () => "Téléphone",
    cell: ({ row, getValue }) => (
      <ShowErrorInCell item={row.original} fieldName="apprenant.prenom" value={getValue()} />
    ),
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
    cell: () => (
      <Select placeholder="Choisir" onClick={(event) => event.stopPropagation()}>
        <option value="contacte_soutien">Contacté, soutien nécessaire</option>
        <option value="contacte_pas_de_suivi">Contacté, pas de suivi nécessaire</option>
        <option value="deja_accompagne">Déjà accompagné par ML</option>
        <option value="injoignable">Injoignable</option>
        <option value="non_contacte">Non contacté</option>
      </Select>
    ),
    size: 160,
  },
];

const EmailCell = ({ email }) => {
  const [isCopied, setIsCopied] = useState(false);

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
          {validation_error.inputValue || "VIDE"}
        </Text>
      </HStack>
    );
  }
  return value;
};

export default apprenantsTableColumnsDefs;