import React from "react";
import { useRouter } from "next/router";
import { Box, Text } from "@chakra-ui/react";

import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { SiretBlock } from "./components/SiretBlock";

const options = [
  {
    label: "D(R)EETS",
    value: "dreets",
  },
  {
    label: "DDETS",
    value: "ddets",
  },
  {
    label: "DRAAF",
    value: "draaf",
  },
  {
    label: "Académie",
    value: "academie",
  },
  {
    label: "Conseil régional",
    value: "conseil_regional",
  },
];

export const InscriptionOperateurPublic = ({ onEtablissementSelected }) => {
  const router = useRouter();
  const { typeOrganisation } = router.query;

  return (
    <>
      <Text fontWeight="bold">Vous représentez :</Text>
      <Box mt="2w">
        <Input
          name="type"
          fieldType="select"
          placeholder="Sélectionner un opérateur public"
          options={options}
          value={typeOrganisation}
          onChange={(value) => router.push(`/auth/inscription/${value}`)}
          w="100%"
        />
        <SiretBlock onSiretFetched={onEtablissementSelected} />
      </Box>
    </>
  );
};
