import React from "react";
import { Box, Skeleton, Text } from "@chakra-ui/react";

import { useCerfa } from "./formEngine/useCerfa";
import { cerfaSchema } from "./formEngine/cerfaSchema";
import { CerfaControllerContext } from "./formEngine/CerfaControllerContext";
import { useInitCerfa } from "./formEngine/hooks/useInitCerfa";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { EffectifApprenant } from "./cerfaForm/blocks/apprenant/EffectifApprenant";

const Effectif = React.memo(function EffectifMemo({ modeSifa }) {
  const { controller: cerfaController } = useCerfa({ schema: cerfaSchema });
  const { isLoading } = useInitCerfa({ controller: cerfaController, modeSifa });
  useAutoSave({ controller: cerfaController });

  if (isLoading) {
    return <Skeleton height="50px" startColor="grey.300" endColor="galt" my={5} />;
  }

  return (
    <CerfaControllerContext.Provider value={cerfaController}>
      <Box my={12} px={5}>
        <Text mt={3}>+ formulaire Contrats, + formulaire formation</Text>

        <EffectifApprenant />
      </Box>
    </CerfaControllerContext.Provider>
  );
});

export default Effectif;
